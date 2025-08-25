// src/controllers/cliente/checkoutController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';

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
 * Requer autenticação.
 */
export const getCheckoutDetails = async (req: Request, res: Response) => {
    // O middleware de autenticação anexa o 'user' ao 'req'
    const clienteId = (req as any).user?.id;

    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    try {
        // Busca os endereços salvos do cliente
        const enderecosResult = await pool.query(
            'SELECT * FROM enderecos_cliente WHERE id_cliente = $1 ORDER BY padrao DESC, id DESC',
            [clienteId]
        );

        // Aqui poderíamos buscar também os métodos de pagamento disponíveis, se fossem dinâmicos.
        // Por enquanto, vamos assumir que são fixos no frontend (Cartão, Pix, etc.).

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
 * @description Cria um ou mais pedidos a partir do carrinho do cliente.
 * Requer autenticação.
 */
export const placeOrder = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;
    const { items, id_endereco_entrega, forma_pagamento, observacoes } = req.body as {
        items: CartItem[];
        id_endereco_entrega: number;
        forma_pagamento: string;
        observacoes?: string;
    };

    // Validação de entrada
    if (!clienteId) return res.status(401).json({ message: 'Não autorizado.' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'O carrinho está vazio.' });
    if (!id_endereco_entrega) return res.status(400).json({ message: 'O endereço de entrega é obrigatório.' });
    if (!forma_pagamento) return res.status(400).json({ message: 'A forma de pagamento é obrigatória.' });

    const client = await pool.connect();

    try {
        // =================================================================
        // PASSO 1: INICIAR TRANSAÇÃO E VALIDAR TUDO
        // =================================================================
        await client.query('BEGIN');

        // Agrupa os itens por loja
        const itemsByStore: { [key: number]: CartItem[] } = items.reduce((acc, item) => {
            (acc[item.storeId] = acc[item.storeId] || []).push(item);
            return acc;
        }, {} as { [key: number]: CartItem[] });

        const createdOrderIds: number[] = [];

        // Itera sobre cada loja para criar um pedido separado para cada uma
        for (const storeIdStr in itemsByStore) {
            const storeId = parseInt(storeIdStr, 10);
            const storeItems = itemsByStore[storeId];
            let valorTotalPedido = 0;

            // Valida o estoque e calcula o subtotal para os itens desta loja
            for (const item of storeItems) {
                // Busca o preço e o estoque do produto/variação no banco de dados para segurança
                const productQuery = `
                    SELECT 
                        p.preco_base,
                        COALESCE(pp.preco_promocional, p.preco_base) as preco_atual,
                        vp.preco_extra,
                        vp.estoque
                    FROM produtos p
                    LEFT JOIN variacoes_produto vp ON vp.id = $1
                    LEFT JOIN LATERAL (
                        SELECT preco_promocional FROM precos_promocao px
                        WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
                        ORDER BY px.data_inicio DESC LIMIT 1
                    ) pp ON TRUE
                    WHERE p.id = $2 AND p.id_loja = $3 AND p.ativo = true;
                `;
                const productResult = await client.query(productQuery, [item.variationId || null, item.id, storeId]);

                if (productResult.rows.length === 0) {
                    throw new Error(`Produto com ID ${item.id} não encontrado ou inativo na loja ${storeId}.`);
                }

                const dbProduct = productResult.rows[0];

                // Verifica o estoque
                if (dbProduct.estoque < item.quantity) {
                    throw new Error(`Estoque insuficiente para o produto ID ${item.id}.`);
                }

                // Calcula o preço final do item (considerando variações) e adiciona ao total do pedido
                const precoUnitario = Number(dbProduct.preco_atual) + Number(dbProduct.preco_extra || 0);
                valorTotalPedido += precoUnitario * item.quantity;
            }
            
            // TODO: Recalcular o frete aqui no backend para segurança, usando o deliveryController.
            // Por enquanto, vamos confiar no valor que viria do frontend.
            // valorTotalPedido += CUSTO_DO_FRETE_CALCULADO;

            // =================================================================
            // PASSO 2: INSERIR OS DADOS DO PEDIDO
            // =================================================================

            // Cria o pedido principal para esta loja
            const pedidoResult = await client.query(
                `INSERT INTO pedidos (id_cliente, id_loja, id_endereco_entrega, status, forma_pagamento, valor_total, observacoes)
                 VALUES ($1, $2, $3, 'pendente', $4, $5, $6) RETURNING id`,
                [clienteId, storeId, id_endereco_entrega, forma_pagamento, valorTotalPedido, observacoes || null]
            );
            const pedidoId = pedidoResult.rows[0].id;
            createdOrderIds.push(pedidoId);

            // Insere cada item do pedido e atualiza o estoque
            for (const item of storeItems) {
                const productInfoResult = await client.query(
                    `SELECT nome, preco_base FROM produtos WHERE id = $1`, [item.id]
                );
                const variacaoInfoResult = item.variationId ? await client.query(
                    `SELECT tamanho, cor FROM variacoes_produto WHERE id = $1`, [item.variationId]
                ) : { rows: [{}] };

                const precoUnitarioResult = await client.query(
                    `SELECT COALESCE(vp.preco_extra, 0) + COALESCE(pp.preco_promocional, p.preco_base) as preco
                     FROM produtos p
                     LEFT JOIN variacoes_produto vp ON vp.id = $1
                     LEFT JOIN LATERAL (
                        SELECT preco_promocional FROM precos_promocao px
                        WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
                        ORDER BY px.data_inicio DESC LIMIT 1
                     ) pp ON TRUE
                     WHERE p.id = $2`, [item.variationId || null, item.id]
                );
                
                const precoUnitario = precoUnitarioResult.rows[0].preco;

                await client.query(
                    `INSERT INTO itens_pedido (id_pedido, id_produto, id_variacao, nome_produto, tamanho, cor, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        pedidoId,
                        item.id,
                        item.variationId || null,
                        productInfoResult.rows[0].nome,
                        variacaoInfoResult.rows[0].tamanho || null,
                        variacaoInfoResult.rows[0].cor || null,
                        item.quantity,
                        precoUnitario,
                        precoUnitario * item.quantity
                    ]
                );

                // Atualiza (decrementa) o estoque
                if (item.variationId) {
                    await client.query(
                        'UPDATE variacoes_produto SET estoque = estoque - $1 WHERE id = $2',
                        [item.quantity, item.variationId]
                    );
                }
            }

            // =================================================================
            // PASSO 3: CRIAR REGISTRO DE PAGAMENTO
            // =================================================================
            // TODO: Integrar com o gateway de pagamento (Stripe, Mercado Pago, etc.) aqui.
            // O resultado da integração (ID do pagamento, QR Code, etc.) seria salvo na tabela 'pagamentos'.
            
            await client.query(
                `INSERT INTO pagamentos (id_pedido, metodo_pagamento, status_pagamento) VALUES ($1, $2, 'pendente')`,
                [pedidoId, forma_pagamento]
            );
        }

        // Se tudo correu bem, confirma a transação
        await client.query('COMMIT');

        // Limpa o carrinho do usuário no frontend (o frontend fará isso ao receber a resposta de sucesso)

        res.status(201).json({
            message: 'Pedido realizado com sucesso!',
            orderIds: createdOrderIds
        });

    } catch (error) {
        // Se algo deu errado, desfaz todas as operações
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ message: (error as Error).message || 'Erro interno do servidor.' });
    } finally {
        // Libera o cliente de volta para o pool
        client.release();
    }
};
