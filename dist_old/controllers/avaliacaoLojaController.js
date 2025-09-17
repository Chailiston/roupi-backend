"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAvaliacaoLoja = exports.getAvaliacoesPorLoja = void 0;
const connection_1 = require("../database/connection");
// Listar todas as avaliações de uma loja
const getAvaliacoesPorLoja = async (req, res) => {
    const { loja_id } = req.params;
    try {
        const result = await connection_1.pool.query(`SELECT a.*, c.nome as cliente_nome
       FROM avaliacoes_loja a
       JOIN clientes c ON a.cliente_id = c.id
       WHERE a.loja_id = $1
       ORDER BY a.criado_em DESC`, [loja_id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar avaliações da loja' });
    }
};
exports.getAvaliacoesPorLoja = getAvaliacoesPorLoja;
// Criar uma nova avaliação para loja
const createAvaliacaoLoja = async (req, res) => {
    const { loja_id, cliente_id, nota, comentario } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO avaliacoes_loja (loja_id, cliente_id, nota, comentario)
       VALUES ($1, $2, $3, $4) RETURNING *`, [loja_id, cliente_id, nota, comentario]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar avaliação' });
    }
};
exports.createAvaliacaoLoja = createAvaliacaoLoja;
