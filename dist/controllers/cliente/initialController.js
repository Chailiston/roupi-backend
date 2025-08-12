"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInitial = getInitial;
exports.listStores = listStores;
exports.storeDetails = storeDetails;
exports.searchProducts = searchProducts;
exports.listPromotions = listPromotions;
const connection_1 = require("../../database/connection");
// helpers
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
function pushParam(params, v) {
    params.push(v);
    return `$${params.length}`;
}
function toNum(v) {
    if (v === undefined || v === null || v === '')
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function toNumDef(v, def) {
    const n = toNum(v);
    return n === null ? def : n;
}
/** Calcula bounding box aproximado em graus para um raio em km */
function makeBBox(lat, lng, radiusKm) {
    const dLat = radiusKm / 110.574; // ~km por grau de latitude
    const cosLat = Math.cos(lat * Math.PI / 180);
    const kmPerDegLon = 111.320 * Math.max(cosLat, 0.000001); // evita divisão por 0
    const dLng = radiusKm / kmPerDegLon;
    return {
        minLat: lat - dLat,
        maxLat: lat + dLat,
        minLng: lng - dLng,
        maxLng: lng + dLng,
    };
}
/**
 * GET /api/cliente/initial?lat=&lng=&radius_km=&limit=
 * Retorna: categorias, lojas (filtradas por raio se lat/lng forem informados) e promoções.
 */
async function getInitial(req, res) {
    try {
        const q = req.query;
        const lat = toNum(q.lat);
        const lng = toNum(q.lng);
        const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
        const limit = toInt(q.limit, 12);
        const radiusKm = toNumDef(q.radius_km, 50); // mantém seu padrão (50 km)
        const baseCTE = `
      WITH rat AS (
        SELECT l.id,
               COALESCE(ROUND(AVG(al.nota)::numeric, 2), 0) AS rating_avg,
               COUNT(al.id)                                  AS rating_count
          FROM lojas l
          LEFT JOIN avaliacoes_loja al ON al.id_loja = l.id
         GROUP BY l.id
      ),
      prod AS (
        SELECT p.id_loja AS id, COUNT(*) AS total_produtos
          FROM produtos p
         WHERE p.ativo = true
         GROUP BY p.id_loja
      )
    `;
        let lojasSql = '';
        const lojasParams = [];
        if (hasPoint) {
            // bounding box
            const bbox = makeBBox(lat, lng, radiusKm);
            const pLat = pushParam(lojasParams, lat);
            const pLng = pushParam(lojasParams, lng);
            const pRad = pushParam(lojasParams, radiusKm);
            const pMinLa = pushParam(lojasParams, bbox.minLat);
            const pMaxLa = pushParam(lojasParams, bbox.maxLat);
            const pMinLo = pushParam(lojasParams, bbox.minLng);
            const pMaxLo = pushParam(lojasParams, bbox.maxLng);
            const pLimit = pushParam(lojasParams, limit);
            lojasSql = `
        ${baseCTE},
        bbox AS (
          SELECT ${pLat}::numeric AS lat,
                 ${pLng}::numeric AS lng,
                 ${pRad}::numeric AS radius_km,
                 ${pMinLa}::numeric AS min_lat,
                 ${pMaxLa}::numeric AS max_lat,
                 ${pMinLo}::numeric AS min_lng,
                 ${pMaxLo}::numeric AS max_lng
        ),
        base AS (
          SELECT
            l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
            l.latitude, l.longitude,
            COALESCE(rat.rating_avg, 0)      AS rating_avg,
            COALESCE(rat.rating_count, 0)    AS rating_count,
            COALESCE(prod.total_produtos, 0) AS total_produtos,
            ROUND((
              6371 * 2 * ASIN(SQRT(
                POWER(SIN((( (SELECT lat FROM bbox) - l.latitude) * pi() / 180) / 2), 2) +
                COS(l.latitude * pi() / 180) * COS((SELECT lat FROM bbox) * pi() / 180) *
                POWER(SIN((((SELECT lng FROM bbox) - l.longitude) * pi() / 180) / 2), 2)
              ))
            )::numeric, 1) AS distance_km
          FROM lojas l
          LEFT JOIN rat  ON rat.id  = l.id
          LEFT JOIN prod ON prod.id = l.id
          CROSS JOIN bbox
          WHERE l.ativo = true
            AND l.latitude  IS NOT NULL AND l.longitude IS NOT NULL
            AND l.latitude  BETWEEN (SELECT min_lat FROM bbox) AND (SELECT max_lat FROM bbox)
            AND l.longitude BETWEEN (SELECT min_lng FROM bbox) AND (SELECT max_lng FROM bbox)
        )
        SELECT *
          FROM base
         WHERE distance_km <= (SELECT radius_km FROM bbox)
         ORDER BY distance_km ASC, rating_avg DESC, rating_count DESC
         LIMIT ${pLimit}
      `;
        }
        else {
            const pLimit = pushParam(lojasParams, limit);
            lojasSql = `
        ${baseCTE}
        SELECT
          l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
          l.latitude, l.longitude,
          COALESCE(rat.rating_avg, 0)      AS rating_avg,
          COALESCE(rat.rating_count, 0)    AS rating_count,
          COALESCE(prod.total_produtos, 0) AS total_produtos,
          NULL::numeric AS distance_km
        FROM lojas l
        LEFT JOIN rat  ON rat.id  = l.id
        LEFT JOIN prod ON prod.id = l.id
        WHERE l.ativo = true
        ORDER BY
          (CASE WHEN COALESCE(rat.rating_count,0)=0 THEN 0 ELSE COALESCE(rat.rating_avg,0) END) DESC,
          COALESCE(rat.rating_count,0) DESC
        LIMIT ${pLimit}
      `;
        }
        const lojasQ = await connection_1.pool.query(lojasSql, lojasParams);
        const categoriasQ = await connection_1.pool.query(`SELECT DISTINCT categoria
         FROM produtos
        WHERE ativo = true
          AND categoria IS NOT NULL
          AND categoria <> ''
        ORDER BY categoria`);
        // promos resumidas para Home (uma promoção por produto, mais recente)
        const promosQ = await connection_1.pool.query(`SELECT DISTINCT ON (p.id)
              pr.id,
              pr.tipo,
              pr.valor,
              pr.data_inicio,
              pr.data_fim,
              p.id               AS id_produto,
              p.id_loja          AS id_loja,
              p.nome             AS nome_produto,
              p.preco_base       AS preco_base,
              img.url            AS imagem_url,
              COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
         FROM promocoes pr
         JOIN promocao_produtos x ON x.id_promocao = pr.id
         JOIN produtos p          ON p.id = x.id_produto
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
        WHERE pr.ativo = true
          AND now() BETWEEN pr.data_inicio AND pr.data_fim
        ORDER BY p.id, pr.data_inicio DESC
        LIMIT 12`);
        return res.json({
            banners: [],
            categorias: categoriasQ.rows.map(r => r.categoria),
            lojas: lojasQ.rows,
            promocoes: promosQ.rows
        });
    }
    catch (err) {
        console.error('getInitial ->', err);
        return res.status(500).json({ error: 'Erro ao carregar inicial.' });
    }
}
/**
 * GET /api/cliente/stores?name=&address=&categoria=&page=&limit=&sort=&lat=&lng=&radius_km=
 * sort: "name" | "rating" | "orders" (padrão: rating)
 * Suporte opcional a filtro por distância quando lat/lng/radius_km forem enviados.
 */
async function listStores(req, res) {
    try {
        const q = req.query;
        const { name = '', address = '', sort = 'rating', categoria = '' } = q;
        const page = toInt(q.page, 1);
        const limit = toInt(q.limit, 20);
        const offset = (page - 1) * limit;
        const qlat = toNum(q.lat);
        const qlng = toNum(q.lng);
        const hasPoint = Number.isFinite(qlat) && Number.isFinite(qlng);
        const radiusKm = toNumDef(q.radius_km, 50); // mantém padrão de 50 km
        const orderPref = String(sort).toLowerCase() === 'name'
            ? `l.nome ASC`
            : String(sort).toLowerCase() === 'orders'
                ? `COALESCE(ped.qtd_pedidos,0) DESC, l.nome ASC`
                : `COALESCE(rat.rating_avg,0) DESC, COALESCE(rat.rating_count,0) DESC, l.nome ASC`;
        const baseCTE = `
      WITH rat AS (
        SELECT l.id,
               COALESCE(ROUND(AVG(al.nota)::numeric,2),0) AS rating_avg,
               COUNT(al.id)                                AS rating_count
          FROM lojas l
          LEFT JOIN avaliacoes_loja al ON al.id_loja = l.id
         GROUP BY l.id
      ),
      ped AS (
        SELECT l.id, COUNT(pedidos.id) AS qtd_pedidos
          FROM lojas l
          LEFT JOIN pedidos ON pedidos.id_loja = l.id
         GROUP BY l.id
      )
    `;
        const params = [];
        const pName = pushParam(params, String(name));
        const pAddress = pushParam(params, String(address));
        const pCategoria = pushParam(params, String(categoria));
        let sql = '';
        if (hasPoint) {
            const bbox = makeBBox(qlat, qlng, radiusKm);
            const pLat = pushParam(params, qlat);
            const pLng = pushParam(params, qlng);
            const pRad = pushParam(params, radiusKm);
            const pMinLa = pushParam(params, bbox.minLat);
            const pMaxLa = pushParam(params, bbox.maxLat);
            const pMinLo = pushParam(params, bbox.minLng);
            const pMaxLo = pushParam(params, bbox.maxLng);
            const pLimit = pushParam(params, limit);
            const pOffset = pushParam(params, offset);
            sql = `
        ${baseCTE},
        bbox AS (
          SELECT ${pLat}::numeric AS lat,
                 ${pLng}::numeric AS lng,
                 ${pRad}::numeric AS radius_km,
                 ${pMinLa}::numeric AS min_lat,
                 ${pMaxLa}::numeric AS max_lat,
                 ${pMinLo}::numeric AS min_lng,
                 ${pMaxLo}::numeric AS max_lng
        ),
        base AS (
          SELECT
            l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
            l.latitude, l.longitude,
            COALESCE(rat.rating_avg,0)   AS rating_avg,
            COALESCE(rat.rating_count,0) AS rating_count,
            COALESCE(ped.qtd_pedidos,0)  AS pedidos_total,
            ROUND((
              6371 * 2 * ASIN(SQRT(
                POWER(SIN((( (SELECT lat FROM bbox) - l.latitude) * pi() / 180) / 2), 2) +
                COS(l.latitude * pi() / 180) * COS((SELECT lat FROM bbox) * pi() / 180) *
                POWER(SIN((((SELECT lng FROM bbox) - l.longitude) * pi() / 180) / 2), 2)
              ))
            )::numeric, 1) AS distance_km
          FROM lojas l
          LEFT JOIN rat ON rat.id = l.id
          LEFT JOIN ped ON ped.id = l.id
          CROSS JOIN bbox
          WHERE l.ativo = true
            AND (${pName} = '' OR l.nome ILIKE '%'||${pName}||'%')
            AND (${pAddress} = '' OR
                 l.endereco_rua ILIKE '%'||${pAddress}||'%' OR
                 l.endereco_bairro ILIKE '%'||${pAddress}||'%' OR
                 l.endereco_cidade ILIKE '%'||${pAddress}||'%' OR
                 l.endereco_estado ILIKE '%'||${pAddress}||'%')
            AND (${pCategoria} = '' OR EXISTS (
                 SELECT 1 FROM produtos p
                  WHERE p.id_loja = l.id
                    AND p.ativo = true
                    AND p.categoria ILIKE '%'||${pCategoria}||'%'
            ))
            AND l.latitude  IS NOT NULL AND l.longitude IS NOT NULL
            AND l.latitude  BETWEEN (SELECT min_lat FROM bbox) AND (SELECT max_lat FROM bbox)
            AND l.longitude BETWEEN (SELECT min_lng FROM bbox) AND (SELECT max_lng FROM bbox)
        )
        SELECT *
          FROM base
         WHERE distance_km <= (SELECT radius_km FROM bbox)
         ORDER BY distance_km ASC, ${orderPref}
         LIMIT ${pLimit} OFFSET ${pOffset}
      `;
        }
        else {
            const pLimit = pushParam(params, limit);
            const pOffset = pushParam(params, offset);
            sql = `
        ${baseCTE}
        SELECT
          l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
          l.latitude, l.longitude,
          COALESCE(rat.rating_avg,0)   AS rating_avg,
          COALESCE(rat.rating_count,0) AS rating_count,
          COALESCE(ped.qtd_pedidos,0)  AS pedidos_total,
          NULL::numeric AS distance_km
        FROM lojas l
        LEFT JOIN rat ON rat.id = l.id
        LEFT JOIN ped ON ped.id = l.id
        WHERE l.ativo = true
          AND (${pName} = '' OR l.nome ILIKE '%'||${pName}||'%')
          AND (${pAddress} = '' OR
               l.endereco_rua ILIKE '%'||${pAddress}||'%' OR
               l.endereco_bairro ILIKE '%'||${pAddress}||'%' OR
               l.endereco_cidade ILIKE '%'||${pAddress}||'%' OR
               l.endereco_estado ILIKE '%'||${pAddress}||'%')
          AND (${pCategoria} = '' OR EXISTS (
               SELECT 1 FROM produtos p
                WHERE p.id_loja = l.id
                  AND p.ativo = true
                  AND p.categoria ILIKE '%'||${pCategoria}||'%'
          ))
        ORDER BY ${orderPref}
        LIMIT ${pLimit} OFFSET ${pOffset}
      `;
        }
        const { rows } = await connection_1.pool.query(sql, params);
        return res.json({ page, limit, items: rows });
    }
    catch (err) {
        console.error('listStores ->', err);
        return res.status(500).json({ error: 'Erro ao listar lojas.' });
    }
}
/**
 * GET /api/cliente/stores/:id
 * -> dados da loja + produtos ativos + promoções ativas
 */
async function storeDetails(req, res) {
    try {
        const { id } = req.params;
        const lojaQ = await connection_1.pool.query(`WITH rat AS (
         SELECT COALESCE(ROUND(AVG(al.nota)::numeric,2),0) AS rating_avg,
                COUNT(al.id)                                AS rating_count
           FROM avaliacoes_loja al
          WHERE al.id_loja = $1
        )
        SELECT l.id, l.nome, l.email, l.telefone, l.logo_url,
               l.endereco_rua, l.endereco_numero, l.endereco_bairro, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
               COALESCE(rat.rating_avg,0)   AS rating_avg,
               COALESCE(rat.rating_count,0) AS rating_count
          FROM lojas l
          LEFT JOIN rat ON TRUE
         WHERE l.id = $1 AND l.ativo = true`, [id]);
        if (!lojaQ.rows.length)
            return res.status(404).json({ error: 'Loja não encontrada.' });
        const loja = lojaQ.rows[0];
        const produtosQ = await connection_1.pool.query(`SELECT p.id, p.nome, p.descricao, p.categoria, p.preco_base, p.ativo,
              img.url AS imagem_url,
              COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
         FROM produtos p
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
        WHERE p.id_loja = $1 AND p.ativo = true
        ORDER BY p.nome`, [id]);
        const promocoesQ = await connection_1.pool.query(`SELECT pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
              p.id AS id_produto, p.nome AS nome_produto
         FROM promocoes pr
         JOIN promocao_produtos pp ON pp.id_promocao = pr.id
         JOIN produtos p ON p.id = pp.id_produto
        WHERE p.id_loja = $1
          AND pr.ativo = true
          AND now() BETWEEN pr.data_inicio AND pr.data_fim
        ORDER BY pr.data_inicio DESC`, [id]);
        return res.json({ loja, produtos: produtosQ.rows, promocoes: promocoesQ.rows });
    }
    catch (err) {
        console.error('storeDetails ->', err);
        return res.status(500).json({ error: 'Erro ao carregar a loja.' });
    }
}
/**
 * GET /api/cliente/produtos?search=&active=&lojaId=&page=&limit=
 */
async function searchProducts(req, res) {
    try {
        const { search = '', lojaId } = req.query;
        const active = toBoolOrNull(req.query.active);
        const page = toInt(req.query.page, 1);
        const limit = toInt(req.query.limit, 20);
        const offset = (page - 1) * limit;
        const { rows } = await connection_1.pool.query(`SELECT p.id, p.id_loja, p.nome, p.descricao, p.categoria, p.preco_base, p.ativo,
              img.url AS imagem_url,
              COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
         FROM produtos p
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
/**
 * GET /api/cliente/promocoes
 * (continua disponível caso a Home queira mais itens que o /initial retorna)
 */
async function listPromotions(_req, res) {
    try {
        const { rows } = await connection_1.pool.query(`SELECT pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
              p.id               AS id_produto,
              p.id_loja          AS id_loja,
              p.nome             AS nome_produto,
              p.preco_base       AS preco_base,
              img.url            AS imagem_url,
              COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
         FROM promocoes pr
         JOIN promocao_produtos x ON x.id_promocao = pr.id
         JOIN produtos p          ON p.id = x.id_produto
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
        WHERE pr.ativo = true
          AND now() BETWEEN pr.data_inicio AND pr.data_fim
        ORDER BY pr.data_inicio DESC
        LIMIT 100`);
        return res.json(rows);
    }
    catch (err) {
        console.error('listPromotions ->', err);
        return res.status(500).json({ error: 'Erro ao listar promoções.' });
    }
}
