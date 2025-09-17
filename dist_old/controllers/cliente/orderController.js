"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderDetails = exports.listOrders = void 0;
const connection_1 = require("../../database/connection");
/**
 * @route GET /api/cliente/orders
 * @description Lista todos os pedidos de um cliente logado.
 * Retorna uma lista simplificada de pedidos para a tela de histórico.
 */
const listOrders = async (req, res) => {
    // Pega o ID do cliente a partir do token de autenticação (authMiddleware)
    const clienteId = req.user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        // Query para buscar os pedidos do cliente
        const ordersQuery = `
            SELECT
                p.id,
                p.status,
                p.valor_total,
                p.criado_em,
                l.nome AS nome_loja,
                -- Pega a imagem do primeiro item do pedido para usar como capa
                (
                    SELECT prod.imagem_url
                    FROM itens_pedido ip
                    JOIN produtos prod ON ip.id_produto = prod.id
                    WHERE ip.id_pedido = p.id
                    ORDER BY ip.id
                    LIMIT 1
                ) AS imagem_capa
            FROM pedidos p
            JOIN lojas l ON p.id_loja = l.id
            WHERE p.id_cliente = $1
            ORDER BY p.criado_em DESC;
        `;
        const { rows } = await connection_1.pool.query(ordersQuery, [clienteId]);
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar pedidos.' });
    }
};
exports.listOrders = listOrders;
/**
 * @route GET /api/cliente/orders/:id
 * @description Busca os detalhes completos de um pedido específico.
 * Retorna informações detalhadas do pedido, incluindo itens, endereço e pagamento.
 */
const getOrderDetails = async (req, res) => {
    // Pega o ID do cliente (do token) e o ID do pedido (da URL)
    const clienteId = req.user?.id;
    const { id: pedidoId } = req.params;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        // Query principal para buscar os detalhes do pedido
        const orderDetailsQuery = `
            SELECT
                p.id,
                p.status,
                p.valor_total,
                p.valor_frete,
                p.observacoes,
                p.criado_em,
                p.atualizado_em,
                l.nome AS nome_loja,
                l.logo_url AS logo_loja,
                -- Constrói um objeto JSON com os detalhes do endereço de entrega
                json_build_object(
                    'rua', e.rua,
                    'numero', e.numero,
                    'complemento', e.complemento,
                    'bairro', e.bairro,
                    'cidade', e.cidade,
                    'estado', e.estado,
                    'cep', e.cep
                ) AS endereco_entrega,
                -- Pega o status do pagamento da tabela de pagamentos
                pag.status_pagamento
            FROM pedidos p
            JOIN lojas l ON p.id_loja = l.id
            LEFT JOIN enderecos_cliente e ON p.id_endereco_entrega = e.id
            LEFT JOIN pagamentos pag ON p.id = pag.id_pedido
            WHERE p.id = $1 AND p.id_cliente = $2;
        `;
        const orderResult = await connection_1.pool.query(orderDetailsQuery, [pedidoId, clienteId]);
        // Se o pedido não for encontrado ou não pertencer ao cliente, retorna erro 404
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        const orderDetails = orderResult.rows[0];
        // Query para buscar os itens associados a este pedido
        const orderItemsQuery = `
            SELECT
                ip.id,
                ip.nome_produto,
                ip.tamanho,
                ip.cor,
                ip.quantidade,
                ip.preco_unitario,
                ip.subtotal,
                -- Tenta pegar a imagem da variação, se não tiver, pega a imagem principal do produto
                COALESCE(vp.imagem_url, prod.imagem_url) AS imagem_url
            FROM itens_pedido ip
            JOIN produtos prod ON ip.id_produto = prod.id
            LEFT JOIN variacoes_produto vp ON ip.id_variacao = vp.id
            WHERE ip.id_pedido = $1
            ORDER BY ip.id;
        `;
        const itemsResult = await connection_1.pool.query(orderItemsQuery, [pedidoId]);
        // Adiciona a lista de itens ao objeto de detalhes do pedido
        orderDetails.itens = itemsResult.rows;
        res.status(200).json(orderDetails);
    }
    catch (error) {
        console.error(`Erro ao buscar detalhes do pedido ${pedidoId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar detalhes do pedido.' });
    }
};
exports.getOrderDetails = getOrderDetails;
