"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduto = exports.createProduto = exports.getProdutoById = exports.getProdutosByLoja = void 0;
const connection_1 = require("../database/connection");
// =====================
// Produtos
// =====================
// GET /api/lojas/:lojaId/produtos
const getProdutosByLoja = async (req, res) => {
    const { lojaId } = req.params;
    try {
        const { rows } = await connection_1.pool.query(`SELECT
         id,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo,
         criado_em,
         imagem_url
       FROM produtos
       WHERE id_loja = $1
       ORDER BY criado_em DESC`, [lojaId]);
        return res.json(rows);
    }
    catch (err) {
        console.error('Erro ao listar produtos:', err);
        return res.status(500).json({ error: 'Erro interno ao listar produtos' });
    }
};
exports.getProdutosByLoja = getProdutosByLoja;
// GET /api/lojas/:lojaId/produtos/:produtoId
const getProdutoById = async (req, res) => {
    const { lojaId, produtoId } = req.params;
    try {
        const { rows } = await connection_1.pool.query(`SELECT
         id,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo,
         criado_em,
         imagem_url
       FROM produtos
       WHERE id_loja = $1 AND id = $2`, [lojaId, produtoId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        return res.json(rows[0]);
    }
    catch (err) {
        console.error('Erro ao buscar produto:', err);
        return res.status(500).json({ error: 'Erro interno ao buscar produto' });
    }
};
exports.getProdutoById = getProdutoById;
// POST /api/lojas/:lojaId/produtos
const createProduto = async (req, res) => {
    const { lojaId } = req.params;
    const { nome, descricao, categoria, preco_base, ativo } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO produtos (
         id_loja,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo
       ) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`, [lojaId, nome, descricao, categoria, preco_base, ativo]);
        return res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Erro ao criar produto:', err);
        return res.status(500).json({ error: 'Erro interno ao criar produto' });
    }
};
exports.createProduto = createProduto;
// PUT /api/lojas/:lojaId/produtos/:produtoId
const updateProduto = async (req, res) => {
    const { lojaId, produtoId } = req.params;
    const { nome, descricao, categoria, preco_base, ativo, imagem_url } = req.body;
    try {
        const result = await connection_1.pool.query(`UPDATE produtos SET
         nome        = $1,
         descricao   = $2,
         categoria   = $3,
         preco_base  = $4,
         ativo       = $5,
         imagem_url  = $6
       WHERE id_loja  = $7
         AND id       = $8
       RETURNING *`, [
            nome,
            descricao,
            categoria,
            preco_base,
            ativo,
            imagem_url,
            lojaId,
            produtoId
        ]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        return res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return res.status(500).json({ error: 'Erro interno ao atualizar produto' });
    }
};
exports.updateProduto = updateProduto;
