"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduto = exports.updateProduto = exports.createProduto = exports.getProdutosByLoja = exports.getProdutoById = exports.getProdutos = void 0;
const connection_1 = require("../database/connection");
// Listar todos os produtos
const getProdutos = async (req, res) => {
    const result = await connection_1.pool.query('SELECT * FROM produtos WHERE ativo = true ORDER BY id DESC');
    res.json(result.rows);
};
exports.getProdutos = getProdutos;
// Buscar produto por ID
const getProdutoById = async (req, res) => {
    const { id } = req.params;
    const result = await connection_1.pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    res.json(result.rows[0]);
};
exports.getProdutoById = getProdutoById;
// Listar produtos por loja
const getProdutosByLoja = async (req, res) => {
    const { id } = req.params;
    const result = await connection_1.pool.query('SELECT * FROM produtos WHERE loja_id = $1 AND ativo = true ORDER BY id DESC', [id]);
    res.json(result.rows);
};
exports.getProdutosByLoja = getProdutosByLoja;
// Criar produto
const createProduto = async (req, res) => {
    const { loja_id, nome, descricao, preco, categoria, destaque } = req.body;
    const result = await connection_1.pool.query(`INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, destaque)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [loja_id, nome, descricao, preco, categoria, destaque]);
    res.status(201).json(result.rows[0]);
};
exports.createProduto = createProduto;
// Atualizar produto
const updateProduto = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, categoria, destaque } = req.body;
    const result = await connection_1.pool.query(`UPDATE produtos SET nome = $1, descricao = $2, preco = $3, categoria = $4, destaque = $5
     WHERE id = $6 RETURNING *`, [nome, descricao, preco, categoria, destaque, id]);
    res.json(result.rows[0]);
};
exports.updateProduto = updateProduto;
// Desativar produto (soft delete)
const deleteProduto = async (req, res) => {
    const { id } = req.params;
    await connection_1.pool.query(`UPDATE produtos SET ativo = false WHERE id = $1`, [id]);
    res.json({ message: 'Produto desativado com sucesso.' });
};
exports.deleteProduto = deleteProduto;
