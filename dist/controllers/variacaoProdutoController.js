"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVariacao = exports.getVariacoes = void 0;
const connection_1 = require("../database/connection");
const getVariacoes = async (req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM variacoes_produto');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar variações' });
    }
};
exports.getVariacoes = getVariacoes;
const createVariacao = async (req, res) => {
    const { produto_id, tamanho, cor, estoque } = req.body;
    try {
        const result = await connection_1.pool.query('INSERT INTO variacoes_produto (produto_id, tamanho, cor, estoque) VALUES ($1, $2, $3, $4) RETURNING *', [produto_id, tamanho, cor, estoque]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar variação' });
    }
};
exports.createVariacao = createVariacao;
