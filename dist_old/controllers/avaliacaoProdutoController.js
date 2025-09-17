"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAvaliacao = exports.createAvaliacao = exports.getAvaliacoesPorProduto = exports.getAvaliacoes = void 0;
const connection_1 = require("../database/connection");
// Listar todas as avaliações
const getAvaliacoes = async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM avaliacoes_produto ORDER BY criado_em DESC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
};
exports.getAvaliacoes = getAvaliacoes;
// Listar avaliações por produto
const getAvaliacoesPorProduto = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query('SELECT * FROM avaliacoes_produto WHERE produto_id = $1 ORDER BY criado_em DESC', [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar avaliações do produto' });
    }
};
exports.getAvaliacoesPorProduto = getAvaliacoesPorProduto;
// Criar avaliação
const createAvaliacao = async (req, res) => {
    const { produto_id, cliente_id, nota, comentario } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO avaliacoes_produto 
       (produto_id, cliente_id, nota, comentario) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [produto_id, cliente_id, nota, comentario]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar avaliação' });
    }
};
exports.createAvaliacao = createAvaliacao;
// Deletar avaliação
const deleteAvaliacao = async (req, res) => {
    const { id } = req.params;
    try {
        await connection_1.pool.query('DELETE FROM avaliacoes_produto WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar avaliação' });
    }
};
exports.deleteAvaliacao = deleteAvaliacao;
