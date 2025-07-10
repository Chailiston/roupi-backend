"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marcarComoLida = exports.createNotificacao = exports.getNotificacoesPorCliente = void 0;
const connection_1 = require("../database/connection");
// Listar notificações por cliente
const getNotificacoesPorCliente = async (req, res) => {
    const { cliente_id } = req.params;
    try {
        const result = await connection_1.pool.query(`SELECT * FROM notificacoes
       WHERE cliente_id = $1
       ORDER BY criado_em DESC`, [cliente_id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
};
exports.getNotificacoesPorCliente = getNotificacoesPorCliente;
// Criar nova notificação
const createNotificacao = async (req, res) => {
    const { cliente_id, titulo, mensagem } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO notificacoes (cliente_id, titulo, mensagem)
       VALUES ($1, $2, $3) RETURNING *`, [cliente_id, titulo, mensagem]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar notificação' });
    }
};
exports.createNotificacao = createNotificacao;
// Marcar como lida
const marcarComoLida = async (req, res) => {
    const { id } = req.params;
    try {
        await connection_1.pool.query(`UPDATE notificacoes SET lida = true WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Notificação marcada como lida' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
};
exports.marcarComoLida = marcarComoLida;
