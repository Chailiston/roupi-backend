import { Request, Response } from 'express'
import { pool } from '../../database/connection'

// ===================== Helpers =====================
function toInt(v: any, def: number) {
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) && n > 0 ? n : def
}
function toBoolOrNull(v: any) {
  if (v === undefined || v === null) return null
  const s = String(v).toLowerCase()
  if (s === 'true') return true
  if (s === 'false') return false
  return null
}
function pushParam(params: any[], v: any) {
  params.push(v)
  return `$${params.length}`
}
function toNum(v: any): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function toNumDef(v: any, def: number): number {
  const n = toNum(v)
  return n === null ? def : n
}

/** Calcula bounding box aproximado em graus para um raio em km */
function makeBBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 110.574 // ~km/° lat
  const cosLat = Math.cos(lat * Math.PI / 180)
  const kmPerDegLon = 111.320 * Math.max(cosLat, 0.000001) // evita div/0
  const dLng = radiusKm / kmPerDegLon
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  }
}

// ===================================================
// GET /api/cliente/initial?lat=&lng=&radius_km=&limit=
// categorias, lojas (com filtro por raio se lat/lng) e promoções
// ===================================================
export async function getInitial(req: Request, res: Response) {
  try {
    // 1. Validação e sanitização dos parâmetros de entrada
    const lat = toNum(req.query.lat);
    const lng = toNum(req.query.lng);
    const hasPoint = lat !== null && lng !== null;
    const limit = toInt(req.query.limit, 12);
    const radiusKm = toNumDef(req.query.radius_km, 50);

    // 2. Definição das queries
    const baseCTE = `
      WITH rat AS (
        SELECT l.id,
               COALESCE(ROUND(AVG(al.nota)::numeric, 2), 0) AS rating_avg,
               COUNT(al.id) AS rating_count
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
    const lojasParams: any[] = [];

    if (hasPoint) {
      const bbox = makeBBox(lat, lng, radiusKm);
      const pLat     = pushParam(lojasParams, lat);
      const pLng     = pushParam(lojasParams, lng);
      const pRad     = pushParam(lojasParams, radiusKm);
      const pMinLa   = pushParam(lojasParams, bbox.minLat);
      const pMaxLa   = pushParam(lojasParams, bbox.maxLat);
      const pMinLo   = pushParam(lojasParams, bbox.minLng);
      const pMaxLo   = pushParam(lojasParams, bbox.maxLng);
      const pLimit   = pushParam(lojasParams, limit);

      lojasSql = `
        ${baseCTE},
        bbox AS (
          SELECT ${pLat}::numeric AS lat, ${pLng}::numeric AS lng, ${pRad}::numeric AS radius_km,
                 ${pMinLa}::numeric AS min_lat, ${pMaxLa}::numeric AS max_lat,
                 ${pMinLo}::numeric AS min_lng, ${pMaxLo}::numeric AS max_lng
        ),
        base AS (
          SELECT
            l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
            l.latitude, l.longitude,
            COALESCE(rat.rating_avg, 0) AS rating_avg,
            COALESCE(rat.rating_count, 0) AS rating_count,
            COALESCE(prod.total_produtos, 0) AS total_produtos,
            ROUND((
              6371 * 2 * ASIN(SQRT(
                POWER(SIN((( (SELECT lat FROM bbox) - l.latitude) * pi() / 180) / 2), 2) +
                COS(l.latitude * pi() / 180) * COS((SELECT lat FROM bbox) * pi() / 180) *
                POWER(SIN((((SELECT lng FROM bbox) - l.longitude) * pi() / 180) / 2), 2)
              ))
            )::numeric, 1) AS distance_km
          FROM lojas l
          LEFT JOIN rat  ON rat.id = l.id
          LEFT JOIN prod ON prod.id = l.id
          CROSS JOIN bbox
          WHERE l.ativo = true
            AND l.latitude BETWEEN (SELECT min_lat FROM bbox) AND (SELECT max_lat FROM bbox)
            AND l.longitude BETWEEN (SELECT min_lng FROM bbox) AND (SELECT max_lng FROM bbox)
        )
        SELECT * FROM base
        WHERE distance_km <= (SELECT radius_km FROM bbox)
        ORDER BY distance_km ASC, rating_avg DESC, rating_count DESC
        LIMIT ${pLimit}
      `;
    } else {
      const pLimit = pushParam(lojasParams, limit);
      lojasSql = `
        ${baseCTE}
        SELECT
          l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
          l.latitude, l.longitude,
          COALESCE(rat.rating_avg, 0) AS rating_avg,
          COALESCE(rat.rating_count, 0) AS rating_count,
          COALESCE(prod.total_produtos, 0) AS total_produtos,
          NULL::numeric AS distance_km
        FROM lojas l
        LEFT JOIN rat  ON rat.id = l.id
        LEFT JOIN prod ON prod.id = l.id
        WHERE l.ativo = true
        ORDER BY (CASE WHEN COALESCE(rat.rating_count,0)=0 THEN 0 ELSE COALESCE(rat.rating_avg,0) END) DESC,
                 COALESCE(rat.rating_count,0) DESC
        LIMIT ${pLimit}
      `;
    }

    const categoriasSql = `
      SELECT DISTINCT categoria
        FROM produtos
       WHERE ativo = true AND categoria IS NOT NULL AND categoria <> ''
       ORDER BY categoria
    `;

    const promosSql = `
      SELECT DISTINCT ON (p.id)
             pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
             p.id AS id_produto, p.id_loja, p.nome AS nome_produto, p.preco_base,
             img.url AS imagem_url,
             COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual
        FROM promocoes pr
        JOIN promocao_produtos x ON x.id_promocao = pr.id
        JOIN produtos p ON p.id = x.id_produto
        LEFT JOIN LATERAL (
          SELECT url FROM produtos_imagens pi
           WHERE pi.id_produto = p.id
           ORDER BY ordem ASC LIMIT 1
        ) img ON TRUE
        LEFT JOIN LATERAL (
          SELECT preco_promocional FROM precos_promocao px
           WHERE px.id_produto = p.id
             AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim
           ORDER BY px.data_inicio DESC LIMIT 1
        ) pp ON TRUE
       WHERE pr.ativo = true
         AND now() BETWEEN pr.data_inicio AND pr.data_fim -- BUG CORRIGIDO AQUI
       ORDER BY p.id, pr.data_inicio DESC
       LIMIT 12
    `;

    // 3. Execução das queries em paralelo para melhor performance
    const [lojasResult, categoriasResult, promosResult] = await Promise.all([
      pool.query(lojasSql, lojasParams),
      pool.query(categoriasSql),
      pool.query(promosSql)
    ]);

    // 4. Montagem e envio da resposta
    return res.json({
      banners: [],
      categorias: categoriasResult.rows.map(r => r.categoria),
      lojas: lojasResult.rows,
      promocoes: promosResult.rows
    });

  } catch (err) {
    console.error('getInitial ->', err);
    return res.status(500).json({ error: 'Erro ao carregar dados iniciais.' });
  }
}

// ===================================================
// GET /api/cliente/stores?name=&address=&categoria=&page=&limit=&sort=&lat=&lng=&radius_km=
// Lista de lojas (com filtro por raio quando lat/lng presentes)
// ===================================================
export async function listStores(req: Request, res: Response) {
  try {
    const q = req.query as any
    const { name = '', address = '', sort = 'rating', categoria = '' } = q
    const page = toInt(q.page, 1)
    const limit = toInt(q.limit, 20)
    const offset = (page - 1) * limit

    const qlat = toNum(q.lat)
    const qlng = toNum(q.lng)
    const hasPoint = Number.isFinite(qlat) && Number.isFinite(qlng)
    const radiusKm = toNumDef(q.radius_km, 50) // padrão: 50 km

    // usado apenas no branch SEM lat/lng (lá as aliases existem)
    const orderPref =
      String(sort).toLowerCase() === 'name'
        ? `l.nome ASC`
        : String(sort).toLowerCase() === 'orders'
        ? `COALESCE(ped.qtd_pedidos,0) DESC, l.nome ASC`
        : `COALESCE(rat.rating_avg,0) DESC, COALESCE(rat.rating_count,0) DESC, l.nome ASC`

    const baseCTE = `
      WITH rat AS (
        SELECT l.id,
               COALESCE(ROUND(AVG(al.nota)::numeric,2),0) AS rating_avg,
               COUNT(al.id)                           AS rating_count
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
    `

    const params: any[] = []
    const pName = pushParam(params, String(name))
    const pAddress = pushParam(params, String(address))
    const pCategoria = pushParam(params, String(categoria))

    let sql = ''
    if (hasPoint) {
      const bbox = makeBBox(qlat as number, qlng as number, radiusKm)
      const pLat     = pushParam(params, qlat)
      const pLng     = pushParam(params, qlng)
      const pRad     = pushParam(params, radiusKm)
      const pMinLa = pushParam(params, bbox.minLat)
      const pMaxLa = pushParam(params, bbox.maxLat)
      const pMinLo = pushParam(params, bbox.minLng)
      const pMaxLo = pushParam(params, bbox.maxLng)
      const pLimit = pushParam(params, limit)
      const pOffset = pushParam(params, offset)

      // IMPORTANTE: aliases disponíveis no SELECT * FROM base
      const orderPrefBase =
        String(sort).toLowerCase() === 'name'
          ? `nome ASC`
          : String(sort).toLowerCase() === 'orders'
          ? `pedidos_total DESC, nome ASC`
          : `rating_avg DESC, rating_count DESC, nome ASC`

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
            COALESCE(rat.rating_avg,0)  AS rating_avg,
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
            AND l.latitude  BETWEEN -90 AND 90
            AND l.longitude BETWEEN -180 AND 180
            AND l.latitude  BETWEEN (SELECT min_lat FROM bbox) AND (SELECT max_lat FROM bbox)
            AND l.longitude BETWEEN (SELECT min_lng FROM bbox) AND (SELECT max_lng FROM bbox)
        )
        SELECT *
          FROM base
         WHERE distance_km <= (SELECT radius_km FROM bbox)
         ORDER BY distance_km ASC, ${orderPrefBase}
         LIMIT ${pLimit} OFFSET ${pOffset}
      `
    } else {
      const pLimit = pushParam(params, limit)
      const pOffset = pushParam(params, offset)

      sql = `
        ${baseCTE}
        SELECT
          l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
          l.latitude, l.longitude,
          COALESCE(rat.rating_avg,0)  AS rating_avg,
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
      `
    }

    const { rows } = await pool.query(sql, params)
    return res.json({ page, limit, items: rows })
  } catch (err) {
    console.error('listStores ->', err)
    return res.status(500).json({ error: 'Erro ao listar lojas.' })
  }
}

// ===================================================
// GET /api/cliente/stores/:id
// ===================================================
export async function storeDetails(req: Request, res: Response) {
  try {
    const { id } = req.params

    const lojaQ = await pool.query(
      `WITH rat AS (
        SELECT COALESCE(ROUND(AVG(al.nota)::numeric,2),0) AS rating_avg,
               COUNT(al.id)                           AS rating_count
          FROM avaliacoes_loja al
         WHERE al.id_loja = $1
       )
       SELECT l.id, l.nome, l.email, l.telefone, l.logo_url,
              l.endereco_rua, l.endereco_numero, l.endereco_bairro, l.endereco_cidade, l.endereco_estado, l.endereco_cep,
              COALESCE(rat.rating_avg,0)  AS rating_avg,
              COALESCE(rat.rating_count,0) AS rating_count
         FROM lojas l
         LEFT JOIN rat ON TRUE
        WHERE l.id = $1 AND l.ativo = true`,
      [id]
    )
    if (!lojaQ.rows.length) return res.status(404).json({ error: 'Loja não encontrada.' })
    const loja = lojaQ.rows[0]

    const produtosQ = await pool.query(
      `SELECT p.id, p.nome, p.descricao, p.categoria, p.preco_base, p.ativo,
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
        ORDER BY p.nome`,
      [id]
    )

    const promocoesQ = await pool.query(
      `SELECT pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
              p.id AS id_produto, p.nome AS nome_produto
         FROM promocoes pr
         JOIN promocao_produtos pp ON pp.id_promocao = pr.id
         JOIN produtos p ON p.id = pp.id_produto
        WHERE p.id_loja = $1
          AND pr.ativo = true
          AND now() BETWEEN pr.data_inicio AND pr.data_fim
        ORDER BY pr.data_inicio DESC`,
      [id]
    )

    return res.json({ loja, produtos: produtosQ.rows, promocoes: promocoesQ.rows })
  } catch (err) {
    console.error('storeDetails ->', err)
    return res.status(500).json({ error: 'Erro ao carregar a loja.' })
  }
}

// ===================================================
// GET /api/cliente/produtos?search=&active=&lojaId=&page=&limit=
// ===================================================
export async function searchProducts(req: Request, res: Response) {
  try {
    const { search = '', lojaId } = req.query as any
    const active = toBoolOrNull((req.query as any).active)
    const page = toInt((req.query as any).page, 1)
    const limit = toInt((req.query as any).limit, 20)
    const offset = (page - 1) * limit

    const { rows } = await pool.query(
      `SELECT p.id, p.id_loja, p.nome, p.descricao, p.categoria, p.preco_base, p.ativo,
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
        LIMIT $4 OFFSET $5`,
      [search, lojaId || null, active, limit, offset]
    )

    return res.json({ page, limit, items: rows })
  } catch (err) {
    console.error('searchProducts ->', err)
    return res.status(500).json({ error: 'Erro ao buscar produtos.' })
  }
}

// ===================================================
// GET /api/cliente/promocoes
// ===================================================
export async function listPromotions(_req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
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
        LIMIT 100`
    )
    return res.json(rows)
  } catch (err) {
    console.error('listPromotions ->', err)
    return res.status(500).json({ error: 'Erro ao listar promoções.' })
  }
}