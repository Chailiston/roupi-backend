"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreDetails = getStoreDetails;
const connection_1 = require("../../database/connection");
// --- Helpers ---
function toNum(v) {
    if (v === undefined || v === null || v === '')
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function pushParam(params, v) {
    params.push(v);
    return `$${params.length}`;
}
const haversineDistance = `
  ROUND(
    (
      6371 * acos(
        cos(radians($_LAT_)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($_LNG_)) + 
        sin(radians($_LAT_)) * sin(radians(l.latitude))
      )
    )::numeric, 1
  )
`;
// ===================================================
// GET /api/cliente/lojas/:id
// ===================================================
async function getStoreDetails(req, res) {
    try {
        const { id } = req.params;
        const q = req.query;
        const searchTerm = q.q || '';
        const lat = toNum(q.lat);
        const lng = toNum(q.lng);
        const hasPoint = lat !== null && lng !== null;
        const storeParams = [id];
        let distanceCalc = 'NULL::numeric AS distance_km';
        if (hasPoint) {
            const pLat = pushParam(storeParams, lat);
            const pLng = pushParam(storeParams, lng);
            distanceCalc = haversineDistance.replace(/\$_LAT_/g, pLat).replace(/\$_LNG_/g, pLng) + ' AS distance_km';
        }
        const storeSql = `
            SELECT
                l.id, l.nome, l.logo_url, l.banner_url, l.endereco_cidade, 
                l.endereco_estado, l.tempo_entrega_estimado, l.taxa_entrega,
                l.horario_funcionamento,
                COALESCE(rat.rating_avg, 0) as avaliacao,
                COALESCE(rat.rating_count, 0) as avaliacoes_total,
                ${distanceCalc}
            FROM lojas l
            LEFT JOIN LATERAL (
                SELECT 
                    COALESCE(ROUND(AVG(nota)::numeric, 1), 0) AS rating_avg,
                    COUNT(id) as rating_count
                FROM avaliacoes_loja WHERE id_loja = l.id
            ) rat ON TRUE
            WHERE l.id = $1 AND l.ativo = true;
        `;
        const storeResult = await connection_1.pool.query(storeSql, storeParams);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Loja não encontrada ou inativa.' });
        }
        const storeDetails = storeResult.rows[0];
        const reviewsSql = `
            SELECT a.nota, a.comentario, c.nome as cliente_nome
            FROM avaliacoes_loja a
            JOIN clientes c ON a.id_cliente = c.id
            WHERE a.id_loja = $1 AND a.comentario IS NOT NULL AND a.comentario <> ''
            ORDER BY a.criado_em DESC
            LIMIT 3;
        `;
        const reviewsResult = await connection_1.pool.query(reviewsSql, [id]);
        const productParams = [id];
        let productWhereClauses = ['p.id_loja = $1', 'p.ativo = true'];
        if (searchTerm) {
            const pSearch = pushParam(productParams, `%${searchTerm}%`);
            productWhereClauses.push(`(p.nome ILIKE ${pSearch} OR p.descricao ILIKE ${pSearch})`);
        }
        const productsSql = `
            SELECT
                p.id, p.nome, p.descricao, p.categoria, p.preco_base,
                COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual,
                COALESCE(img.url, p.imagem_url) AS imagem_url
            FROM produtos p
            LEFT JOIN LATERAL (SELECT url FROM produtos_imagens pi WHERE pi.id_produto = p.id ORDER BY ordem ASC LIMIT 1) img ON TRUE
            LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE
            WHERE ${productWhereClauses.join(' AND ')}
            ORDER BY p.categoria, p.nome;
        `;
        const productsResult = await connection_1.pool.query(productsSql, productParams);
        // [CORREÇÃO] Tipamos a variável 'offers' para que o TS saiba o que esperar
        const offers = [];
        const productsByCategory = productsResult.rows.reduce((acc, product) => {
            if (product.preco_atual < product.preco_base) {
                offers.push(product);
            }
            const categoryName = product.categoria || 'Outros';
            if (!acc[categoryName]) {
                acc[categoryName] = { nome: categoryName, produtos: [] };
            }
            acc[categoryName].produtos.push(product);
            return acc;
        }, {});
        const finalCategories = Object.values(productsByCategory);
        if (offers.length > 0) {
            finalCategories.unshift({
                nome: 'Ofertas',
                produtos: offers
            });
        }
        const finalResponse = {
            ...storeDetails,
            avaliacoes_recentes: reviewsResult.rows,
            categorias_produtos: finalCategories
        };
        return res.json(finalResponse);
    }
    catch (err) {
        console.error('getStoreDetails ->', err);
        return res.status(500).json({ error: 'Erro ao buscar detalhes da loja.' });
    }
}
