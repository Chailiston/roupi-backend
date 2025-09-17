"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMensagemChamado = exports.getMensagensChamado = exports.getChamadosPorCliente = exports.createChamado = void 0;
const connection_1 = require("../database/connection");
// Criar novo chamado
const createChamado = async (req, res) => {
    const { cliente_id, assunto, status } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO chamados (cliente_id, assunto, status)
       VALUES ($1, $2, $3) RETURNING *`, [cliente_id, assunto, status || 'aberto']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar chamado' });
    }
};
exports.createChamado = createChamado;
// Listar chamados por cliente
const getChamadosPorCliente = async (req, res) => {
    const { cliente_id } = req.params;
    try {
        const result = await connection_1.pool.query(`SELECT * FROM chamados WHERE cliente_id = $1 ORDER BY criado_em DESC`, [cliente_id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar chamados' });
    }
};
exports.getChamadosPorCliente = getChamadosPorCliente;
// Listar todas as mensagens de um chamado
const getMensagensChamado = async (req, res) => {
    const { chamado_id } = req.params;
    try {
        const result = await connection_1.pool.query(`SELECT * FROM mensagens_chamado WHERE chamado_id = $1 ORDER BY criado_em ASC`, [chamado_id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar mensagens do chamado' });
    }
};
exports.getMensagensChamado = getMensagensChamado;
// Enviar mensagem para chamado
const createMensagemChamado = async (req, res) => {
    const { chamado_id, remetente, mensagem } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO mensagens_chamado (chamado_id, remetente, mensagem)
       VALUES ($1, $2, $3) RETURNING *`, [chamado_id, remetente, mensagem]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
};
exports.createMensagemChamado = createMensagemChamado;
