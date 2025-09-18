import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// CORREÇÃO: Removido o 'PreferenceItem' que não existe e adicionado 'MercadoPagoConfig' para tipagem
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// Valida se a chave de ambiente do Mercado Pago foi carregada
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("A variável de ambiente MP_ACCESS_TOKEN não está definida.");
}

// Cria o cliente de configuração do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);

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
 * @route    POST /api/cliente/create-preference
 * @desc     Cria uma preferência de pagamento no Mercado Pago (Checkout Pro).
 * @access   Private
 * @note     Esta é a nova função principal para iniciar um pagamento.
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
            // CORREÇÃO: Alterado o tipo para 'any[]' para resolver o erro de importação.
            // A estrutura dos itens adicionados abaixo já é a correta para a API.
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

            await tx.pedidos.updateMany({
                where: { id: { in: idsPedidosCriados } },
                data: { mp_preference_id: preferenceResponse.id }
            });

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
 * @route    GET /api/cliente/checkout/details
 * @desc     Busca os dados necessários para a tela de checkout (ex: endereços).
 * @access   Private
 */
export const getCheckoutDetails = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id as number;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const enderecos = await prisma.enderecos_cliente.findMany({
            where: { id_cliente: clienteId, ativo: true },
            orderBy: [{ padrao: 'desc' }, { criado_em: 'desc' }],
        });
        res.status(200).json({ enderecos });
    } catch (error) {
        console.error('Erro ao buscar detalhes do checkout:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * @route    POST /api/cliente/orders
 * @desc     [DESCONTINUADO] Rota antiga para o Payment Brick.
 * @access   Private
 */
export const placeOrder = async (req: Request, res: Response) => {
    res.status(501).json({ message: "Esta rota foi descontinuada. Por favor, use a rota /api/cliente/create-preference." });
};

