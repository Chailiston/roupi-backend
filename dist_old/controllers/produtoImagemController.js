"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCoverImage = exports.deleteImagemProduto = exports.addImagemProduto = exports.getImagensByProduto = void 0;
const connection_1 = require("../database/connection");
// GET /api/lojas/:lojaId/produtos/:produtoId/imagens
const getImagensByProduto = async (req, res) => {
    const { produtoId } = req.params;
    try {
        const { rows } = await connection_1.pool.query(`SELECT id, url, ordem
       FROM produtos_imagens
       WHERE id_produto = $1
       ORDER BY ordem ASC
       LIMIT 10`, [produtoId]);
        return res.json(rows);
    }
    catch (err) {
        console.error('Erro ao listar imagens do produto:', err);
        return res.status(500).json({ error: 'Erro interno ao listar imagens' });
    }
};
exports.getImagensByProduto = getImagensByProduto;
// POST /api/lojas/:lojaId/produtos/:produtoId/imagens
const addImagemProduto = async (req, res) => {
    const { produtoId } = req.params;
    const { url } = req.body;
    try {
        // garante no máximo 10 imagens
        const countRes = await connection_1.pool.query(`SELECT COUNT(*)::int AS cnt
       FROM produtos_imagens
       WHERE id_produto = $1`, [produtoId]);
        if (countRes.rows[0].cnt >= 10) {
            return res.status(400).json({ error: 'Limite de 10 imagens por produto atingido' });
        }
        // nova ordem = maior ordem atual + 1
        const maxRes = await connection_1.pool.query(`SELECT COALESCE(MAX(ordem), -1)::int AS max_ordem
       FROM produtos_imagens
       WHERE id_produto = $1`, [produtoId]);
        const nextOrdem = maxRes.rows[0].max_ordem + 1;
        const result = await connection_1.pool.query(`INSERT INTO produtos_imagens (
         id_produto,
         url,
         ordem
       ) VALUES ($1,$2,$3)
       RETURNING id, url, ordem`, [produtoId, url, nextOrdem]);
        return res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Erro ao adicionar imagem ao produto:', err);
        return res.status(500).json({ error: 'Erro interno ao adicionar imagem' });
    }
};
exports.addImagemProduto = addImagemProduto;
// DELETE /api/lojas/:lojaId/produtos/:produtoId/imagens/:imagemId
const deleteImagemProduto = async (req, res) => {
    const { produtoId, imagemId } = req.params;
    try {
        const result = await connection_1.pool.query(`DELETE FROM produtos_imagens
       WHERE id_produto = $1
         AND id         = $2
       RETURNING id`, [produtoId, imagemId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada' });
        }
        return res.json({ message: 'Imagem excluída com sucesso' });
    }
    catch (err) {
        console.error('Erro ao excluir imagem do produto:', err);
        return res.status(500).json({ error: 'Erro interno ao excluir imagem' });
    }
};
exports.deleteImagemProduto = deleteImagemProduto;
// PUT /api/lojas/:lojaId/produtos/:produtoId/imagens/:imagemId/capa
const setCoverImage = async (req, res) => {
    const { produtoId, imagemId } = req.params;
    try {
        await connection_1.pool.query(`UPDATE produtos_imagens
       SET ordem = CASE
         WHEN id = $1 THEN 0
         ELSE ordem + 1
       END
       WHERE id_produto = $2`, [imagemId, produtoId]);
        return res.json({ message: 'Imagem de capa atualizada' });
    }
    catch (err) {
        console.error('Erro ao definir imagem de capa:', err);
        return res.status(500).json({ error: 'Erro interno ao definir capa' });
    }
};
exports.setCoverImage = setCoverImage;
