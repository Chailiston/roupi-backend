// src/controllers/cliente/checkoutController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import Stripe from 'stripe';

// Inicializa a Stripe com a chave secreta do seu arquivo .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-07-30.basil',
});

// Tipagem para os itens do carrinho que vêm do frontend
interface CartItem {
    id: number; // id do produto
    storeId: number;
    quantity: number;
    variationId?: number;
}

/**
 * @route GET /api/cliente/checkout/details
 * @description Busca os dados necessários para a tela de checkout.
 */
export const getCheckoutDetails = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const enderecosResult = await pool.query(
            'SELECT * FROM enderecos_cliente WHERE id_cliente = $1 ORDER BY padrao DESC, id DESC',
            [clienteId]
        );
        res.status(200).json({
            enderecos: enderecosResult.rows,
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do checkout:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};


/**
 * @route POST /api/cliente/orders
 * @description Cria um ou mais pedidos e inicia a intenção de pagamento na Stripe.
 */
export const placeOrder = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;
    const { items, id_endereco_entrega, forma_pagamento, observacoes } = req.body as {
        items: CartItem[];
        id_endereco_entrega: number;
        forma_pagamento: string;
        observacoes?: string;
    };

    if (!clienteId) return res.status(401).json({ message: 'Não autorizado.' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'O carrinho está vazio.' });
    if (!id_endereco_entrega) return res.status(400).json({ message: 'O endereço de entrega é obrigatório.' });
    if (!forma_pagamento) return res.status(400).json({ message: 'A forma de pagamento é obrigatória.' });

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const itemsByStore: { [key: number]: CartItem[] } = items.reduce((acc, item) => {
            (acc[item.storeId] = acc[item.storeId] || []).push(item);
            return acc;
        }, {} as { [key: number]: CartItem[] });

        const createdOrders: any[] = [];

        for (const storeIdStr in itemsByStore) {
            const storeId = parseInt(storeIdStr, 10);
            const storeItems = itemsByStore[storeId];
            let valorSubtotalProdutos = 0;

            for (const item of storeItems) {
                const productResult = await client.query(
                    `SELECT p.preco_base, COALESCE(pp.preco_promocional, p.preco_base) as preco_atual, vp.preco_extra, vp.estoque FROM produtos p LEFT JOIN variacoes_produto vp ON vp.id = $1 LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE WHERE p.id = $2 AND p.id_loja = $3 AND p.ativo = true;`,
                    [item.variationId || null, item.id, storeId]
                );
                if (productResult.rows.length === 0) throw new Error(`Produto com ID ${item.id} não encontrado ou inativo na loja ${storeId}.`);
                const dbProduct = productResult.rows[0];
                if (dbProduct.estoque < item.quantity) throw new Error(`Estoque insuficiente para o produto ID ${item.id}.`);
                const precoUnitario = Number(dbProduct.preco_atual) + Number(dbProduct.preco_extra || 0);
                valorSubtotalProdutos += precoUnitario * item.quantity;
            }

            const lojaSettingsResult = await client.query('SELECT pedido_minimo_entrega, frete_gratis_acima_de, taxa_entrega_fixa FROM lojas WHERE id = $1', [storeId]);
            if (lojaSettingsResult.rows.length === 0) throw new Error(`Loja com ID ${storeId} não encontrada.`);
            const loja = lojaSettingsResult.rows[0];
            let valorFrete = 0;
            if (valorSubtotalProdutos < Number(loja.pedido_minimo_entrega || 0)) throw new Error(`O valor mínimo do pedido para esta loja é de R$ ${loja.pedido_minimo_entrega}.`);
            if (loja.frete_gratis_acima_de && valorSubtotalProdutos >= Number(loja.frete_gratis_acima_de)) {
                valorFrete = 0;
            } else {
                valorFrete = Number(loja.taxa_entrega_fixa || 0);
            }
            const valorTotalPedido = valorSubtotalProdutos + valorFrete;

            const pedidoResult = await client.query(
                `INSERT INTO pedidos (id_cliente, id_loja, id_endereco_entrega, status, forma_pagamento, valor_total, valor_frete, observacoes) VALUES ($1, $2, $3, 'aguardando_pagamento', $4, $5, $6, $7) RETURNING id`,
                [clienteId, storeId, id_endereco_entrega, forma_pagamento, valorTotalPedido, valorFrete, observacoes || null]
            );
            const pedidoId = pedidoResult.rows[0].id;

            for (const item of storeItems) {
                const productInfoResult = await client.query(
                    `SELECT nome FROM produtos WHERE id = $1`, [item.id]
                );
                const variacaoInfoResult = item.variationId ? await client.query(
                    `SELECT tamanho, cor FROM variacoes_produto WHERE id = $1`, [item.variationId]
                ) : { rows: [{}] };

                const precoUnitarioResult = await client.query(
                    `SELECT COALESCE(vp.preco_extra, 0) + COALESCE(pp.preco_promocional, p.preco_base) as preco FROM produtos p LEFT JOIN variacoes_produto vp ON vp.id = $1 LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE WHERE p.id = $2`, [item.variationId || null, item.id]
                );
                
                const precoUnitario = precoUnitarioResult.rows[0].preco;

                await client.query(
                    `INSERT INTO itens_pedido (id_pedido, id_produto, id_variacao, nome_produto, tamanho, cor, quantidade, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [pedidoId, item.id, item.variationId || null, productInfoResult.rows[0].nome, variacaoInfoResult.rows[0].tamanho || null, variacaoInfoResult.rows[0].cor || null, item.quantity, precoUnitario, precoUnitario * item.quantity]
                );

                if (item.variationId) {
                    await client.query(
                        'UPDATE variacoes_produto SET estoque = estoque - $1 WHERE id = $2',
                        [item.quantity, item.variationId]
                    );
                }
            }
            
            const lojaStripeAccountResult = await client.query(
                `SELECT connected_account_id FROM loja_payment_settings 
                 WHERE id_loja = $1 AND provider = 'stripe' AND ativo = true AND connected_account_id IS NOT NULL 
                 ORDER BY id DESC LIMIT 1`,
                [storeId]
            );
            
            const lojistaStripeAccountId = lojaStripeAccountResult.rows[0]?.connected_account_id;
            if (!lojistaStripeAccountId) {
                throw new Error(`Loja com ID ${storeId} não possui uma conta de pagamento Stripe ativa e configurada.`);
            }

            const comissao = Math.round(valorTotalPedido * 100 * 0.10); // 10% em centavos

            // ✅ AJUSTE TEMPORÁRIO: Removido 'boleto' e 'pix' pois a conta Stripe está "Em análise"
            // e não possui esses métodos de pagamento ativados.
            // Adicione-os de volta quando a conta for aprovada e os métodos ativados no Dashboard.
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(valorTotalPedido * 100),
                currency: 'brl',
                payment_method_types: ['card'],
                application_fee_amount: comissao,
                transfer_data: {
                    destination: lojistaStripeAccountId,
                },
                metadata: {
                    pedido_id: pedidoId,
                    cliente_id: clienteId,
                    loja_id: storeId,
                }
            });

            await client.query(
                `INSERT INTO pagamentos (id_pedido, metodo_pagamento, status_pagamento, stripe_payment_intent_id, stripe_client_secret) VALUES ($1, $2, 'pendente', $3, $4)`,
                [pedidoId, forma_pagamento, paymentIntent.id, paymentIntent.client_secret]
            );

            createdOrders.push({
                pedidoId: pedidoId,
                clientSecret: paymentIntent.client_secret,
            });
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Intenção de pagamento criada com sucesso!',
            orders: createdOrders
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ message: (error as Error).message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};
