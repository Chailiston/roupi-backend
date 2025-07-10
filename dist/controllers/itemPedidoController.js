"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItemPedido = exports.updateItemPedido = exports.createItemPedido = exports.getItensPorPedido = exports.getItensPedido = void 0;
const connection_1 = require("../database/connection");
// Listar todos os itens de pedidos (admin/teste)
const getItensPedido = async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM itens_pedido ORDER BY id DESC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
    }
};
exports.getItensPedido = getItensPedido;
// Listar itens por ID de pedido
const getItensPorPedido = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query(`SELECT * FROM itens_pedido WHERE pedido_id = $1 ORDER BY id ASC`, [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
    }
};
exports.getItensPorPedido = getItensPorPedido;
// Criar item do pedido
const createItemPedido = async (req, res) => {
    const { pedido_id, produto_id, variacao_id, quantidade, preco_unitario } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO itens_pedido 
      (pedido_id, produto_id, variacao_id, quantidade, preco_unitario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`, [pedido_id, produto_id, variacao_id, quantidade, preco_unitario]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar item ao pedido' });
    }
};
exports.createItemPedido = createItemPedido;
// Atualizar item do pedido
const updateItemPedido = async (req, res) => {
    const { id } = req.params;
    const { quantidade, preco_unitario } = req.body;
    try {
        const result = await connection_1.pool.query(`UPDATE itens_pedido 
       SET quantidade = $1, preco_unitario = $2
       WHERE id = $3
       RETURNING *`, [quantidade, preco_unitario, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar item do pedido' });
    }
};
exports.updateItemPedido = updateItemPedido;
// Remover item do pedido
const deleteItemPedido = async (req, res) => {
    const { id } = req.params;
    try {
        await connection_1.pool.query('DELETE FROM itens_pedido WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao remover item do pedido' });
    }
};
exports.deleteItemPedido = deleteItemPedido;
