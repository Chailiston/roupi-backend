"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusPedido = exports.createPedido = exports.getPedidosPorCliente = exports.getPedidoById = exports.getPedidos = void 0;
const connection_1 = require("../database/connection");
// Listar todos os pedidos
const getPedidos = async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
};
exports.getPedidos = getPedidos;
// Buscar pedido por ID
const getPedidoById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
};
exports.getPedidoById = getPedidoById;
// Listar pedidos de um cliente
const getPedidosPorCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query('SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY criado_em DESC', [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos do cliente' });
    }
};
exports.getPedidosPorCliente = getPedidosPorCliente;
// Criar pedido
const createPedido = async (req, res) => {
    const { cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO pedidos 
      (cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar pedido' });
    }
};
exports.createPedido = createPedido;
// Atualizar status do pedido
const updateStatusPedido = async (req, res) => {
    const { id } = req.params;
    const { status_pagamento, status_entrega } = req.body;
    try {
        const result = await connection_1.pool.query(`UPDATE pedidos 
       SET status_pagamento = $1, status_entrega = $2
       WHERE id = $3
       RETURNING *`, [status_pagamento, status_entrega, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
};
exports.updateStatusPedido = updateStatusPedido;
