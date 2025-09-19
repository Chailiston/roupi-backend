import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// Valida se a chave de ambiente do Mercado Pago foi carregada
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("A variável de ambiente MP_ACCESS_TOKEN não está definida.");
}

// Cria os clientes de configuração do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);
const paymentSDK = new Payment(client);

// Tipagem para os itens do carrinho que vêm do frontend
interface CartItem {
    id: number; // id do produto
    storeId: number;
    quantity: number;
    variationId?: number;
}

// Tipagem para o objeto que agrupa itens por loja
type ItemsByStore = { [key: number]: CartItem[] };

/**
 * @route     POST /api/cliente/pagamentos/preferencia
 * @desc      Cria uma preferência de pagamento no Mercado Pago (Checkout Pro).
 * @access    Private
 */
export const createPaymentPreference = async (req: Request, res: Response) => {
    // Assumimos que o middleware de autenticação adiciona 'user' ao 'req'
    const clienteId = (req as any).user?.id as number;
    const { items, id_endereco_entrega, observacoes } = req.body;

    // Validações
    if (!clienteId) return res.status(401).json({ message: 'Não autorizado.' });
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'O carrinho está vazio ou em formato inválido.' });
    if (!id_endereco_entrega) return res.status(400).json({ message: 'O endereço de entrega é obrigatório.' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const preferenceItems: any[] = [];
            const idsPedidosCriados: number[] = [];

            const itemsByStore = (items as CartItem[]).reduce((acc: ItemsByStore, item: CartItem) => {
                if (item.storeId) {
                    (acc[item.storeId] = acc[item.storeId] || []).push(item);
                }
                return acc;
            }, {} as ItemsByStore);

            for (const storeIdStr in itemsByStore) {
                const storeId = parseInt(storeIdStr, 10);
                const storeItems = itemsByStore[storeId];
                let subtotalProdutos = 0;
                const itensParaSalvarNoPedido: any[] = [];

                for (const item of storeItems) {
                    const variacao = await tx.variacoes_produto.findFirst({
                        where: { id: item.variationId, id_produto: item.id },
                        include: { produtos: true }
                    });

                    if (!variacao || !variacao.produtos) throw new Error(`Produto ou variação não encontrado (ID: ${item.id})`);
                    if (variacao.estoque == null || variacao.estoque < item.quantity) {
                        throw new Error(`Estoque insuficiente para: ${variacao.produtos.nome}`);
                    }

                    const precoUnitario = Number(variacao.produtos.preco_base) + Number(variacao.preco_extra || 0);
                    subtotalProdutos += precoUnitario * item.quantity;

                    preferenceItems.push({
                        id: String(variacao.id),
                        title: `${variacao.produtos.nome} (${variacao.tamanho || 'único'} / ${variacao.cor || 'padrão'})`,
                        quantity: item.quantity,
                        unit_price: Number(precoUnitario.toFixed(2)),
                        category_id: "fashion",
                    });

                    itensParaSalvarNoPedido.push({
                        id_produto: variacao.id_produto,
                        id_variacao: variacao.id,
                        nome_produto: variacao.produtos.nome,
                        tamanho: variacao.tamanho,
                        cor: variacao.cor,
                        quantidade: item.quantity,
                        preco_unitario: precoUnitario,
                        subtotal: precoUnitario * item.quantity,
                    });
                }

                const loja = await tx.lojas.findUnique({ where: { id: storeId } });
                if (!loja) throw new Error(`Loja não encontrada (ID: ${storeId})`);

                let valorFrete = Number(loja.taxa_entrega_fixa || 0);
                if (loja.frete_gratis_acima_de && subtotalProdutos >= Number(loja.frete_gratis_acima_de)) {
                    valorFrete = 0;
                }

                if (valorFrete > 0) {
                    preferenceItems.push({
                        id: `frete_${storeId}`,
                        title: `Frete - ${loja.nome}`,
                        quantity: 1,
                        unit_price: Number(valorFrete.toFixed(2)),
                    });
                }

                const valorTotalPedido = subtotalProdutos + valorFrete;

                const pedido = await tx.pedidos.create({
                    data: {
                        id_cliente: clienteId,
                        id_loja: storeId,
                        id_endereco_entrega: id_endereco_entrega,
                        status: 'aguardando_pagamento',
                        forma_pagamento: 'mercadopago_pro',
                        valor_total: valorTotalPedido,
                        valor_frete: valorFrete,
                        observacoes,
                    }
                });
                idsPedidosCriados.push(pedido.id);

                await tx.itens_pedido.createMany({
                    data: itensParaSalvarNoPedido.map(item => ({
                        ...item,
                        id_pedido: pedido.id,
                    }))
                });

                for (const item of storeItems) {
                    await tx.variacoes_produto.update({
                        where: { id: item.variationId },
                        data: { estoque: { decrement: item.quantity } }
                    });
                }
            }

            const cliente = await tx.clientes.findUnique({ where: { id: clienteId } });
            if (!cliente) throw new Error("Cliente não encontrado");

            const preferenceResponse = await preference.create({
                body: {
                    items: preferenceItems,
                    payer: {
                        name: cliente.nome || undefined,
                        email: cliente.email,
                    },
                    back_urls: {
                        success: "https://rouppi.com.br/pedido/sucesso",
                        failure: "https://rouppi.com.br/pedido/falha",
                        pending: "https://rouppi.com.br/pedido/pendente",
                    },
                    auto_return: "approved",
                    metadata: { ids_pedidos: JSON.stringify(idsPedidosCriados) },
                    notification_url: "https://roupi-backend.onrender.com/api/pagamentos/webhook"
                }
            });

            if (!preferenceResponse.id || !preferenceResponse.init_point) {
                throw new Error("Falha ao obter ID ou URL de pagamento do Mercado Pago.");
            }

            await tx.pedidos.updateMany({
                where: { id: { in: idsPedidosCriados } },
                data: { mp_preference_id: preferenceResponse.id }
            });

            for (const pedidoId of idsPedidosCriados) {
                await tx.pagamentos.create({
                    data: {
                        id_pedido: pedidoId,
                        metodo_pagamento: 'mercadopago_pro',
                        status_pagamento: 'pendente',
                        url_pagamento: preferenceResponse.init_point,
                    }
                });
            }

            return { init_point: preferenceResponse.init_point, preference_id: preferenceResponse.id };
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
        res.status(500).json({ message: errorMessage });
    }
};

/**
 * @route     POST /api/pagamentos/webhook
 * @desc      Recebe e processa notificações de webhook do Mercado Pago.
 * @access    Public
 */
export const handleWebhook = async (req: Request, res: Response) => {
    console.log('--- Webhook do Mercado Pago recebido ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const notification = req.body;

    if (notification.type === 'payment' && notification.data?.id) {
        const paymentId = notification.data.id;
        console.log(`Processando pagamento com ID: ${paymentId}`);

        try {
            const payment = await paymentSDK.get({ id: paymentId });
            
            if (!payment || !payment.id) {
                console.warn(`Pagamento com ID ${paymentId} não encontrado no Mercado Pago.`);
                return res.status(200).send('Pagamento não encontrado');
            }
            
            console.log('Detalhes do pagamento:', JSON.stringify(payment, null, 2));

            const idsPedidos: number[] = JSON.parse(payment.metadata?.ids_pedidos || '[]');
            if (idsPedidos.length === 0) {
                console.error(`ERRO: Metadados 'ids_pedidos' não encontrados para o pagamento ${paymentId}.`);
                return res.status(200).send('Metadados de pedidos ausentes.');
            }
            
            let novoStatusPagamento: string;
            let novoStatusPedido: string;

            switch (payment.status) {
                case 'approved':
                    novoStatusPagamento = 'pago';
                    novoStatusPedido = 'pagamento_aprovado';
                    break;
                case 'rejected':
                    novoStatusPagamento = 'falhou';
                    novoStatusPedido = 'pagamento_falhou';
                    break;
                case 'cancelled':
                    novoStatusPagamento = 'cancelado';
                    novoStatusPedido = 'cancelado';
                    break;
                default:
                    console.log(`Status '${payment.status}' não requer ação imediata.`);
                    return res.status(200).send('Status não processado.');
            }

            await prisma.$transaction(async (tx) => {
                console.log(`Atualizando status para '${novoStatusPagamento}' para os pedidos:`, idsPedidos);

                await tx.pagamentos.updateMany({
                    where: { id_pedido: { in: idsPedidos } },
                    data: {
                        status_pagamento: novoStatusPagamento,
                        provider_payment_id: String(payment.id),
                        paid_at: payment.status === 'approved' ? new Date() : null
                    }
                });

                await tx.pedidos.updateMany({
                    where: { id: { in: idsPedidos } },
                    data: {
                        status: novoStatusPedido
                    }
                });
            });

            console.log('Banco de dados atualizado com sucesso.');

        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            return res.status(200).send('Erro interno ao processar.');
        }
    }

    res.status(200).send('Webhook recebido.');
};
