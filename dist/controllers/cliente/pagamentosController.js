"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.createPaymentPreference = void 0;
const client_1 = require("@prisma/client");
const mercadopago_1 = require("mercadopago");
const prisma = new client_1.PrismaClient();
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("A variável de ambiente MP_ACCESS_TOKEN não está definida.");
}
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new mercadopago_1.Preference(client);
const paymentSDK = new mercadopago_1.Payment(client);
const createPaymentPreference = async (req, res) => {
    console.log('--- Controlador createPaymentPreference INICIADO ---'); // LOG INICIAL
    const clienteId = req.user?.id;
    const { items, id_endereco_entrega, observacoes } = req.body;
    if (!clienteId)
        return res.status(401).json({ message: 'Não autorizado.' });
    if (!items || !Array.isArray(items) || items.length === 0)
        return res.status(400).json({ message: 'O carrinho está vazio.' });
    if (!id_endereco_entrega)
        return res.status(400).json({ message: 'O endereço de entrega é obrigatório.' });
    try {
        console.log('ETAPA 1: Iniciando transação com o banco de dados...');
        const result = await prisma.$transaction(async (tx) => {
            console.log('ETAPA 2: Dentro da transação. Processando itens do carrinho...');
            const preferenceItems = [];
            const idsPedidosCriados = [];
            const itemsByStore = items.reduce((acc, item) => {
                if (item.storeId) {
                    (acc[item.storeId] = acc[item.storeId] || []).push(item);
                }
                return acc;
            }, {});
            for (const storeIdStr in itemsByStore) {
                const storeId = parseInt(storeIdStr, 10);
                const storeItems = itemsByStore[storeId];
                console.log(`Processando pedido para a loja ID: ${storeId}`);
                // ... (lógica interna do loop, que parece correta)
                let subtotalProdutos = 0;
                const itensParaSalvarNoPedido = [];
                for (const item of storeItems) {
                    const variacao = await tx.variacoes_produto.findFirst({ where: { id: item.variationId, id_produto: item.id }, include: { produtos: true } });
                    if (!variacao || !variacao.produtos)
                        throw new Error(`Produto ou variação não encontrado (ID: ${item.id})`);
                    if (variacao.estoque == null || variacao.estoque < item.quantity)
                        throw new Error(`Estoque insuficiente para: ${variacao.produtos.nome}`);
                    const precoUnitario = Number(variacao.produtos.preco_base) + Number(variacao.preco_extra || 0);
                    subtotalProdutos += precoUnitario * item.quantity;
                    preferenceItems.push({ id: String(variacao.id), title: `${variacao.produtos.nome} (${variacao.tamanho || 'único'} / ${variacao.cor || 'padrão'})`, quantity: item.quantity, unit_price: Number(precoUnitario.toFixed(2)), category_id: "fashion" });
                    itensParaSalvarNoPedido.push({ id_produto: variacao.id_produto, id_variacao: variacao.id, nome_produto: variacao.produtos.nome, tamanho: variacao.tamanho, cor: variacao.cor, quantidade: item.quantity, preco_unitario: precoUnitario, subtotal: precoUnitario * item.quantity });
                }
                const loja = await tx.lojas.findUnique({ where: { id: storeId } });
                if (!loja)
                    throw new Error(`Loja não encontrada (ID: ${storeId})`);
                let valorFrete = Number(loja.taxa_entrega_fixa || 0);
                if (loja.frete_gratis_acima_de && subtotalProdutos >= Number(loja.frete_gratis_acima_de)) {
                    valorFrete = 0;
                }
                if (valorFrete > 0) {
                    preferenceItems.push({ id: `frete_${storeId}`, title: `Frete - ${loja.nome}`, quantity: 1, unit_price: Number(valorFrete.toFixed(2)) });
                }
                const valorTotalPedido = subtotalProdutos + valorFrete;
                const pedido = await tx.pedidos.create({ data: { id_cliente: clienteId, id_loja: storeId, id_endereco_entrega, status: 'aguardando_pagamento', forma_pagamento: 'mercadopago_pro', valor_total: valorTotalPedido, valor_frete: valorFrete, observacoes } });
                idsPedidosCriados.push(pedido.id);
                await tx.itens_pedido.createMany({ data: itensParaSalvarNoPedido.map(item => ({ ...item, id_pedido: pedido.id })) });
                for (const item of storeItems) {
                    await tx.variacoes_produto.update({ where: { id: item.variationId }, data: { estoque: { decrement: item.quantity } } });
                }
            }
            console.log('ETAPA 3: Buscando dados do cliente para o pagamento...');
            const cliente = await tx.clientes.findUnique({ where: { id: clienteId } });
            if (!cliente)
                throw new Error("Cliente não encontrado");
            console.log('ETAPA 4: Enviando requisição para a API do Mercado Pago...');
            const preferenceResponse = await preference.create({
                body: {
                    items: preferenceItems,
                    payer: { name: cliente.nome || undefined, email: cliente.email },
                    back_urls: { success: "https://rouppi.com.br/pedido/sucesso", failure: "https://rouppi.com.br/pedido/falha", pending: "https://rouppi.com.br/pedido/pendente" },
                    auto_return: "approved",
                    metadata: { ids_pedidos: JSON.stringify(idsPedidosCriados) },
                    notification_url: "https://roupi-backend.onrender.com/api/pagamentos/webhook"
                }
            });
            console.log('ETAPA 5: Resposta recebida do Mercado Pago.');
            if (!preferenceResponse.id || !preferenceResponse.init_point) {
                throw new Error("Falha ao obter ID ou URL de pagamento do Mercado Pago.");
            }
            console.log('ETAPA 6: Atualizando pedidos e criando registros de pagamento no banco...');
            await tx.pedidos.updateMany({ where: { id: { in: idsPedidosCriados } }, data: { mp_preference_id: preferenceResponse.id } });
            for (const pedidoId of idsPedidosCriados) {
                await tx.pagamentos.create({
                    data: { id_pedido: pedidoId, metodo_pagamento: 'mercadopago_pro', status_pagamento: 'pendente', url_pagamento: preferenceResponse.init_point }
                });
            }
            console.log('ETAPA 7: Transação concluída com sucesso.');
            return { init_point: preferenceResponse.init_point, preference_id: preferenceResponse.id };
        }, {
            maxWait: 15000, // Tempo máximo de espera para iniciar a transação (15s)
            timeout: 30000, // Tempo máximo que a transação pode durar (30s)
        });
        console.log('ETAPA 8: Enviando resposta para o cliente...');
        res.status(201).json(result);
        console.log('--- Controlador createPaymentPreference FINALIZADO com sucesso ---');
    }
    catch (error) {
        console.error('--- ERRO no controlador createPaymentPreference ---', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
        res.status(500).json({ message: errorMessage });
    }
};
exports.createPaymentPreference = createPaymentPreference;
const handleWebhook = async (req, res) => {
    // ... (código do webhook, sem alterações)
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
            const idsPedidos = JSON.parse(payment.metadata?.ids_pedidos || '[]');
            if (idsPedidos.length === 0) {
                console.error(`ERRO: Metadados 'ids_pedidos' não encontrados para o pagamento ${paymentId}.`);
                return res.status(200).send('Metadados de pedidos ausentes.');
            }
            let novoStatusPagamento;
            let novoStatusPedido;
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
                await tx.pagamentos.updateMany({ where: { id_pedido: { in: idsPedidos } }, data: { status_pagamento: novoStatusPagamento, provider_payment_id: String(payment.id), paid_at: payment.status === 'approved' ? new Date() : null } });
                await tx.pedidos.updateMany({ where: { id: { in: idsPedidos } }, data: { status: novoStatusPedido } });
            });
            console.log('Banco de dados atualizado com sucesso.');
        }
        catch (error) {
            console.error('Erro ao processar webhook:', error);
            return res.status(200).send('Erro interno ao processar.');
        }
    }
    res.status(200).send('Webhook recebido.');
};
exports.handleWebhook = handleWebhook;
