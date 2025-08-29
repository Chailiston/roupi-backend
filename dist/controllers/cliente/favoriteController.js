"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFavoriteStatus = exports.removeFavorite = exports.addFavorite = exports.listFavorites = void 0;
const connection_1 = require("../../database/connection");
/**
 * @route   GET /api/cliente/favoritos
 * @desc    Listar todos os produtos favoritados pelo cliente
 * @access  Private
 */
const listFavorites = async (req, res) => {
    const clienteId = req.user?.id;
    try {
        const sql = `
            SELECT
                f.id_produto,
                p.nome,
                p.preco_base,
                COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual,
                COALESCE(img.url, p.imagem_url) AS imagem_url,
                l.nome AS nome_loja
            FROM favoritos f
            JOIN produtos p ON f.id_produto = p.id
            JOIN lojas l ON p.id_loja = l.id
            LEFT JOIN LATERAL (
                SELECT url FROM produtos_imagens pi
                WHERE pi.id_produto = p.id
                ORDER BY pi.ordem ASC
                LIMIT 1
            ) img ON TRUE
            LEFT JOIN LATERAL (
                SELECT preco_promocional FROM precos_promocao px
                WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
                ORDER BY px.data_inicio DESC LIMIT 1
            ) pp ON TRUE
            WHERE f.id_cliente = $1 AND p.ativo = true
            ORDER BY f.criado_em DESC;
        `;
        const { rows } = await connection_1.pool.query(sql, [clienteId]);
        res.json(rows);
    }
    catch (error) {
        console.error('Erro ao listar favoritos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listFavorites = listFavorites;
/**
 * @route   POST /api/cliente/favoritos
 * @desc    Adicionar um produto aos favoritos
 * @access  Private
 */
const addFavorite = async (req, res) => {
    const clienteId = req.user?.id;
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ message: 'O ID do produto é obrigatório.' });
    }
    try {
        // Verifica se o favorito já existe para não duplicar
        const existingFavorite = await connection_1.pool.query('SELECT id FROM favoritos WHERE id_cliente = $1 AND id_produto = $2', [clienteId, productId]);
        if (existingFavorite.rows.length > 0) {
            return res.status(200).json({ message: 'Produto já está nos favoritos.' });
        }
        const sql = 'INSERT INTO favoritos (id_cliente, id_produto) VALUES ($1, $2) RETURNING *';
        const { rows } = await connection_1.pool.query(sql, [clienteId, productId]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.addFavorite = addFavorite;
/**
 * @route   DELETE /api/cliente/favoritos/:productId
 * @desc    Remover um produto dos favoritos
 * @access  Private
 */
const removeFavorite = async (req, res) => {
    const clienteId = req.user?.id;
    const { productId } = req.params;
    try {
        const sql = 'DELETE FROM favoritos WHERE id_cliente = $1 AND id_produto = $2';
        const result = await connection_1.pool.query(sql, [clienteId, productId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.removeFavorite = removeFavorite;
/**
 * @route   GET /api/cliente/favoritos/status/:productId
 * @desc    Verificar se um produto está favoritado
 * @access  Private
 */
const checkFavoriteStatus = async (req, res) => {
    const clienteId = req.user?.id;
    const { productId } = req.params;
    try {
        const sql = 'SELECT EXISTS (SELECT 1 FROM favoritos WHERE id_cliente = $1 AND id_produto = $2)';
        const { rows } = await connection_1.pool.query(sql, [clienteId, productId]);
        res.json({ isFavorited: rows[0].exists });
    }
    catch (error) {
        console.error('Erro ao verificar status do favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.checkFavoriteStatus = checkFavoriteStatus;
