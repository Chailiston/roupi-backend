"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = exports.getCheckoutDetails = void 0;
const connection_1 = require("../../database/connection");
// NOVO: Importa o SDK do Mercado Pago
const mercadopago_1 = require("mercadopago");
// NOVO: Inicializa o cliente do Mercado Pago com o SEU Access Token (do marketplace)
// Este cliente será usado para operações que não são de pagamento direto, como buscar parcelas.
const marketplaceClient = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});
/**
 * @route GET /api/cliente/checkout/details
 * @description Busca os dados necessários para a tela de checkout (ex: endereços).
 * @note Esta função permanece igual, não há necessidade de alterá-la.
 */
const getCheckoutDetails = async (req, res) => {
    const clienteId = req.user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const enderecosResult = await connection_1.pool.query('SELECT * FROM enderecos_cliente WHERE id_cliente = $1 ORDER BY padrao DESC, id DESC', [clienteId]);
        res.status(200).json({
            enderecos: enderecosResult.rows,
        });
    }
    catch (error) {
        console.error('Erro ao buscar detalhes do checkout:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getCheckoutDetails = getCheckoutDetails;
/**
 * @route POST /api/cliente/orders
 * @description Cria um ou mais pedidos e processa o pagamento via Mercado Pago.
 * @note Esta é a função principal que foi totalmente adaptada da Stripe para o Mercado Pago.
 */
const placeOrder = async (req, res) => {
    const clienteId = req.user?.id;
    // NOVO: O corpo da requisição agora espera os dados do Mercado Pago
    const { items, id_endereco_entrega, forma_pagamento, observacoes, payment_token, // O token do cartão gerado no frontend
    installments, // O número de parcelas escolhido pelo cliente
    payment_method_id, // Ex: 'visa', 'master'
    issuer_id // O ID do banco emissor do cartão
     } = req.body;
    if (!clienteId)
        return res.status(401).json({ message: 'Não autorizado.' });
    if (!items || items.length === 0)
        return res.status(400).json({ message: 'O carrinho está vazio.' });
    if (!id_endereco_entrega)
        return res.status(400).json({ message: 'O endereço de entrega é obrigatório.' });
    // Validações para os novos campos do Mercado Pago
    if (!payment_token || !installments || !payment_method_id || !issuer_id) {
        return res.status(400).json({ message: 'Dados de pagamento incompletos.' });
    }
    const client = await connection_1.pool.connect();
    try {
        await client.query('BEGIN');
        const itemsByStore = items.reduce((acc, item) => {
            (acc[item.storeId] = acc[item.storeId] || []).push(item);
            return acc;
        }, {});
        const createdOrders = [];
        const customerEmail = req.user?.email; // Pega o email do cliente logado
        for (const storeIdStr in itemsByStore) {
            const storeId = parseInt(storeIdStr, 10);
            const storeItems = itemsByStore[storeId];
            let valorSubtotalProdutos = 0;
            for (const item of storeItems) {
                const productResult = await client.query(`SELECT p.preco_base, COALESCE(pp.preco_promocional, p.preco_base) as preco_atual, vp.preco_extra, vp.estoque FROM produtos p LEFT JOIN variacoes_produto vp ON vp.id = $1 LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE WHERE p.id = $2 AND p.id_loja = $3 AND p.ativo = true;`, [item.variationId || null, item.id, storeId]);
                if (productResult.rows.length === 0)
                    throw new Error(`Produto com ID ${item.id} não encontrado ou inativo.`);
                const dbProduct = productResult.rows[0];
                if (dbProduct.estoque < item.quantity)
                    throw new Error(`Estoque insuficiente para o produto ID ${item.id}.`);
                const precoUnitario = Number(dbProduct.preco_atual) + Number(dbProduct.preco_extra || 0);
                valorSubtotalProdutos += precoUnitario * item.quantity;
            }
            const lojaSettingsResult = await client.query('SELECT pedido_minimo_entrega, frete_gratis_acima_de, taxa_entrega_fixa FROM lojas WHERE id = $1', [storeId]);
            if (lojaSettingsResult.rows.length === 0)
                throw new Error(`Loja com ID ${storeId} não encontrada.`);
            const loja = lojaSettingsResult.rows[0];
            let valorFrete = 0;
            if (valorSubtotalProdutos < Number(loja.pedido_minimo_entrega || 0))
                throw new Error(`O valor mínimo do pedido para esta loja é de R$ ${loja.pedido_minimo_entrega}.`);
            if (loja.frete_gratis_acima_de && valorSubtotalProdutos >= Number(loja.frete_gratis_acima_de)) {
                valorFrete = 0;
            }
            else {
                valorFrete = Number(loja.taxa_entrega_fixa || 0);
            }
            const valorTotalPedido = parseFloat((valorSubtotalProdutos + valorFrete).toFixed(2));
            const pedidoResult = await client.query(`INSERT INTO pedidos (id_cliente, id_loja, id_endereco_entrega, status, forma_pagamento, valor_total, valor_frete, observacoes) VALUES ($1, $2, $3, 'aguardando_pagamento', $4, $5, $6, $7) RETURNING id`, [clienteId, storeId, id_endereco_entrega, forma_pagamento, valorTotalPedido, valorFrete, observacoes || null]);
            const pedidoId = pedidoResult.rows[0].id;
            for (const item of storeItems) {
                // Lógica de inserção de itens e atualização de estoque (mantida igual)
                const productInfoResult = await client.query(`SELECT nome FROM produtos WHERE id = $1`, [item.id]);
                const variacaoInfoResult = item.variationId ? await client.query(`SELECT tamanho, cor FROM variacoes_produto WHERE id = $1`, [item.variationId]) : { rows: [{}] };
                const precoUnitarioResult = await client.query(`SELECT COALESCE(vp.preco_extra, 0) + COALESCE(pp.preco_promocional, p.preco_base) as preco FROM produtos p LEFT JOIN variacoes_produto vp ON vp.id = $1 LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE WHERE p.id = $2`, [item.variationId || null, item.id]);
                const precoUnitario = precoUnitarioResult.rows[0].preco;
                await client.query(`INSERT INTO itens_pedido (id_pedido, id_produto, id_variacao, nome_produto, tamanho, cor, quantidade, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [pedidoId, item.id, item.variationId || null, productInfoResult.rows[0].nome, variacaoInfoResult.rows[0].tamanho || null, variacaoInfoResult.rows[0].cor || null, item.quantity, precoUnitario, precoUnitario * item.quantity]);
                if (item.variationId) {
                    await client.query('UPDATE variacoes_produto SET estoque = estoque - $1 WHERE id = $2', [item.quantity, item.variationId]);
                }
            }
            // =========================================================================
            // INÍCIO DA LÓGICA DE PAGAMENTO COM MERCADO PAGO
            // =========================================================================
            // 1. Busca as credenciais do VENDEDOR no banco de dados.
            const lojaMpAccountResult = await client.query(`SELECT api_key, application_fee_percent FROM loja_payment_settings 
                 WHERE id_loja = $1 AND provider = 'mercadopago' AND ativo = true AND api_key IS NOT NULL 
                 ORDER BY id DESC LIMIT 1`, [storeId]);
            if (lojaMpAccountResult.rows.length === 0) {
                throw new Error(`A loja com ID ${storeId} não possui uma conta de pagamento do Mercado Pago ativa.`);
            }
            const { api_key: lojistaAccessToken, application_fee_percent } = lojaMpAccountResult.rows[0];
            // 2. Calcula a comissão da sua plataforma.
            const comissaoPercentual = parseFloat(application_fee_percent) || 0.10; // 10% como padrão
            const valorComissao = parseFloat((valorTotalPedido * comissaoPercentual).toFixed(2));
            // 3. CRIA UM CLIENTE TEMPORÁRIO DO MP USANDO O TOKEN DO VENDEDOR
            const sellerClient = new mercadopago_1.MercadoPagoConfig({ accessToken: lojistaAccessToken });
            const payment = new mercadopago_1.Payment(sellerClient);
            // 4. Cria o corpo da requisição de pagamento
            const paymentRequestBody = {
                transaction_amount: valorTotalPedido,
                token: payment_token,
                description: `Pedido #${pedidoId} - Loja #${storeId}`,
                installments: installments,
                payment_method_id: payment_method_id,
                // ✅ CORREÇÃO: Converte o issuer_id para número, como esperado pela API.
                issuer_id: parseInt(issuer_id, 10),
                payer: {
                    email: customerEmail
                },
                application_fee: valorComissao,
                binary_mode: true,
                metadata: {
                    pedido_id: pedidoId,
                    cliente_id: clienteId,
                    loja_id: storeId,
                }
            };
            // 5. Executa a cobrança
            const paymentResponse = await payment.create({ body: paymentRequestBody });
            const paymentResult = paymentResponse;
            if (paymentResult.status !== 'approved') {
                throw new Error(`Pagamento recusado pelo Mercado Pago. Status: ${paymentResult.status} - ${paymentResult.status_detail}`);
            }
            // 6. Salva os dados do pagamento na sua tabela 'pagamentos'
            await client.query(`INSERT INTO pagamentos (id_pedido, metodo_pagamento, status_pagamento, mp_payment_id, platform_fee_amount, paid_at) VALUES ($1, $2, $3, $4, $5, NOW())`, [pedidoId, forma_pagamento, paymentResult.status, paymentResult.id, valorComissao]);
            // 7. Atualiza o status do pedido para 'pago'
            await client.query(`UPDATE pedidos SET status = 'pago' WHERE id = $1`, [pedidoId]);
            createdOrders.push({
                pedidoId: pedidoId,
                statusPagamento: paymentResult.status,
                paymentId: paymentResult.id,
                valorTotal: valorTotalPedido,
            });
        }
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Pedido(s) criado(s) e pagamento aprovado com sucesso!',
            orders: createdOrders
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido com Mercado Pago:', error);
        const errorMessage = error.cause?.message || error.message || 'Erro interno do servidor.';
        res.status(500).json({ message: errorMessage });
    }
    finally {
        client.release();
    }
};
exports.placeOrder = placeOrder;
