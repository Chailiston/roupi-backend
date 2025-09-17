"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductDetails = getProductDetails;
exports.searchProducts = searchProducts;
exports.getRelatedProducts = getRelatedProducts;
const connection_1 = require("../../database/connection");
// Funções auxiliares (Helpers)
function toInt(v, def) {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : def;
}
function toBoolOrNull(v) {
    if (v === undefined || v === null)
        return null;
    const s = String(v).toLowerCase();
    if (s === 'true')
        return true;
    if (s === 'false')
        return false;
    return null;
}
// ===================================================
// GET /api/cliente/produtos/:id
// ===================================================
async function getProductDetails(req, res) {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'O ID do produto deve ser um número.' });
        }
        const productSql = `
      SELECT
        p.id, p.id_loja, l.nome AS nome_loja, p.nome, p.descricao, p.categoria,
        p.preco_base, p.imagem_url, p.ativo,
        COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual,
        (
          SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'ordem', pi.ordem) ORDER BY pi.ordem)
          FROM produtos_imagens pi WHERE pi.id_produto = p.id
        ) as imagens,
        (
          SELECT json_agg(json_build_object('id', vp.id, 'tamanho', vp.tamanho, 'cor', vp.cor, 'preco_extra', vp.preco_extra, 'estoque', vp.estoque, 'imagem_url', vp.imagem_url))
          FROM variacoes_produto vp WHERE vp.id_produto = p.id AND vp.ativo = true
        ) as variacoes,
        (
          SELECT json_agg(json_build_object('id', ap.id, 'nome_cliente', c.nome, 'nota', ap.nota, 'comentario', ap.comentario, 'criado_em', ap.criado_em))
          FROM avaliacoes_produto ap JOIN clientes c ON ap.id_cliente = c.id
          WHERE ap.id_produto = p.id AND ap.status = 'approved'
        ) as avaliacoes
      FROM produtos p
      JOIN lojas l ON p.id_loja = l.id
      LEFT JOIN LATERAL (
        SELECT preco_promocional FROM precos_promocao px
        WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
        ORDER BY px.data_inicio DESC LIMIT 1
      ) pp ON TRUE
      WHERE p.id = $1 AND p.ativo = true;
    `;
        const { rows } = await connection_1.pool.query(productSql, [numericId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado ou inativo.' });
        }
        const product = rows[0];
        product.imagens = product.imagens || [];
        product.variacoes = product.variacoes || [];
        product.avaliacoes = product.avaliacoes || [];
        return res.json(product);
    }
    catch (err) {
        console.error('getProductDetails ->', err);
        return res.status(500).json({ error: 'Erro ao carregar detalhes do produto.' });
    }
}
// ===================================================
// GET /api/cliente/produtos
// ===================================================
async function searchProducts(req, res) {
    try {
        const { search = '', lojaId } = req.query;
        const active = toBoolOrNull(req.query.active);
        const page = toInt(req.query.page, 1);
        const limit = toInt(req.query.limit, 20);
        const offset = (page - 1) * limit;
        // ✅ CORREÇÃO DEFINITIVA: Adicionado o JOIN com a tabela de lojas
        // e a seleção do campo 'l.nome AS nome_loja'.
        const { rows } = await connection_1.pool.query(`SELECT p.id, p.id_loja, l.nome AS nome_loja, p.nome, p.descricao, p.categoria, p.preco_base, p.ativo,
              COALESCE(img.url, p.imagem_url) AS imagem_url,
              COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
       FROM produtos p
       JOIN lojas l ON p.id_loja = l.id
       LEFT JOIN LATERAL (
         SELECT url FROM produtos_imagens pi
          WHERE pi.id_produto = p.id
          ORDER BY ordem ASC
          LIMIT 1
       ) img ON TRUE
       LEFT JOIN LATERAL (
         SELECT preco_promocional
           FROM precos_promocao px
          WHERE px.id_produto = p.id
            AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
          ORDER BY px.data_inicio DESC
          LIMIT 1
       ) pp ON TRUE
       WHERE ($1 = '' OR p.nome ILIKE '%'||$1||'%' OR p.descricao ILIKE '%'||$1||'%' OR p.categoria ILIKE '%'||$1||'%')
         AND ($2::int IS NULL OR p.id_loja = $2::int)
         AND ($3::boolean IS NULL OR p.ativo = $3::boolean)
       ORDER BY p.nome
       LIMIT $4 OFFSET $5`, [search, lojaId || null, active, limit, offset]);
        return res.json({ page, limit, items: rows });
    }
    catch (err) {
        console.error('searchProducts ->', err);
        return res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
}
// ===================================================
// GET /api/cliente/produtos/:id/related
// ===================================================
async function getRelatedProducts(req, res) {
    try {
        const { id } = req.params;
        const limit = toInt(req.query.limit, 6);
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'O ID do produto deve ser um número.' });
        }
        const originalProductQuery = await connection_1.pool.query('SELECT categoria, id_loja FROM produtos WHERE id = $1', [numericId]);
        if (originalProductQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Produto original não encontrado.' });
        }
        const { categoria, id_loja } = originalProductQuery.rows[0];
        // ✅ CORREÇÃO DEFINITIVA: Adicionado o JOIN com a tabela de lojas
        // e a seleção do campo 'l.nome AS nome_loja'.
        const relatedSql = `
      SELECT
        p.id, p.nome, p.preco_base, p.id_loja, l.nome AS nome_loja,
        COALESCE(img.url, p.imagem_url) AS imagem_url,
        COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
      FROM produtos p
      JOIN lojas l ON p.id_loja = l.id
      LEFT JOIN LATERAL (
        SELECT url FROM produtos_imagens pi WHERE pi.id_produto = p.id ORDER BY ordem ASC LIMIT 1
      ) img ON TRUE
      LEFT JOIN LATERAL (
        SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1
      ) pp ON TRUE
      WHERE 
        p.id <> $1 AND
        p.id_loja = $2 AND
        p.categoria = $3 AND
        p.ativo = true
      ORDER BY RANDOM()
      LIMIT $4;
    `;
        const { rows } = await connection_1.pool.query(relatedSql, [numericId, id_loja, categoria, limit]);
        return res.json(rows);
    }
    catch (err) {
        console.error('getRelatedProducts ->', err);
        return res.status(500).json({ error: 'Erro ao buscar produtos relacionados.' });
    }
}
