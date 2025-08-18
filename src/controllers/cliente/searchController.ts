import { Request, Response } from 'express';
import { pool } from '../../database/connection';

// --- Helpers ---
function toInt(v: any, def: number): number {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function toNum(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pushParam(params: any[], v: any): string {
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
// GET /api/cliente/search/products
// ===================================================
export async function searchProducts(req: Request, res: Response) {
  try {
    const q = req.query as any;
    const searchTerm = q.q || '';
    const categoria = q.categoria || '';
    const minPrice = toNum(q.minPrice);
    const maxPrice = toNum(q.maxPrice);
    const sort = q.sort || 'relevance';
    const page = toInt(q.page, 1);
    const limit = toInt(q.limit, 20);
    const offset = (page - 1) * limit;

    const lat = toNum(q.lat);
    const lng = toNum(q.lng);
    const radiusKm = toNum(q.radius_km);
    const hasPoint = lat !== null && lng !== null;

    const params: any[] = [];
    let whereClauses: string[] = ['p.ativo = true', 'l.ativo = true'];
    let orderByClause = '';
    let distanceCalc = 'NULL::numeric AS distance_km';

    if (hasPoint) {
      const pLat = pushParam(params, lat);
      const pLng = pushParam(params, lng);
      distanceCalc = haversineDistance.replace(/\$_LAT_/g, pLat).replace(/\$_LNG_/g, pLng) + ' AS distance_km';
      if (radiusKm) {
        whereClauses.push(`(${haversineDistance.replace(/\$_LAT_/g, pLat).replace(/\$_LNG_/g, pLng)}) <= ${pushParam(params, radiusKm)}`);
      }
    }

    if (searchTerm) {
      const pSearch = pushParam(params, `%${searchTerm}%`);
      whereClauses.push(`(p.nome ILIKE ${pSearch} OR p.descricao ILIKE ${pSearch})`);
    }
    if (categoria) {
      whereClauses.push(`p.categoria = ${pushParam(params, categoria)}`);
    }
    if (minPrice !== null) {
      whereClauses.push(`COALESCE(pp.preco_promocional, p.preco_base) >= ${pushParam(params, minPrice)}`);
    }
    if (maxPrice !== null) {
      whereClauses.push(`COALESCE(pp.preco_promocional, p.preco_base) <= ${pushParam(params, maxPrice)}`);
    }

    switch (sort) {
      case 'price_asc': orderByClause = 'ORDER BY preco_atual ASC'; break;
      case 'price_desc': orderByClause = 'ORDER BY preco_atual DESC'; break;
      case 'rating': orderByClause = 'ORDER BY rating_avg DESC, p.nome ASC'; break;
      case 'distance': orderByClause = 'ORDER BY distance_km ASC, rating_avg DESC'; break;
      default: orderByClause = hasPoint ? 'ORDER BY distance_km ASC' : 'ORDER BY rating_avg DESC, p.nome ASC';
    }

    const sql = `
      SELECT
        p.id, p.id_loja, p.nome, p.descricao, p.categoria, p.preco_base,
        l.nome as nome_loja,
        COALESCE(img.url, p.imagem_url) AS imagem_url,
        COALESCE(pp.preco_promocional, p.preco_base) AS preco_atual,
        COALESCE(rat.rating_avg, 0) as rating_avg,
        ${distanceCalc}
      FROM produtos p
      JOIN lojas l ON p.id_loja = l.id
      LEFT JOIN LATERAL (SELECT url FROM produtos_imagens pi WHERE pi.id_produto = p.id ORDER BY ordem ASC LIMIT 1) img ON TRUE
      LEFT JOIN LATERAL (SELECT preco_promocional FROM precos_promocao px WHERE px.id_produto = p.id AND CURRENT_DATE BETWEEN px.data_inicio AND px.data_fim ORDER BY px.data_inicio DESC LIMIT 1) pp ON TRUE
      LEFT JOIN LATERAL (SELECT COALESCE(ROUND(AVG(nota)::numeric, 2), 0) AS rating_avg FROM avaliacoes_produto WHERE id_produto = p.id) rat ON TRUE
      WHERE ${whereClauses.join(' AND ')}
      ${orderByClause}
      LIMIT ${pushParam(params, limit)} OFFSET ${pushParam(params, offset)};
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ page, limit, items: rows });

  } catch (err) {
    console.error('searchProducts ->', err);
    return res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
}

// ===================================================
// GET /api/cliente/search/stores
// ===================================================
export async function searchStores(req: Request, res: Response) {
    try {
        const q = req.query as any;
        const searchTerm = q.q || '';
        const sort = q.sort || 'relevance'; // NOVO: Adicionado parâmetro de ordenação
        const page = toInt(q.page, 1);
        const limit = toInt(q.limit, 20);
        const offset = (page - 1) * limit;

        const lat = toNum(q.lat);
        const lng = toNum(q.lng);
        const hasPoint = lat !== null && lng !== null;

        const params: any[] = [];
        let whereClauses: string[] = ['l.ativo = true'];
        let orderByClause = '';
        let distanceCalc = 'NULL::numeric AS distance_km';

        if (hasPoint) {
            const pLat = pushParam(params, lat);
            const pLng = pushParam(params, lng);
            distanceCalc = haversineDistance.replace(/\$_LAT_/g, pLat).replace(/\$_LNG_/g, pLng) + ' AS distance_km';
        }
        
        if (searchTerm) {
            const pSearch = pushParam(params, `%${searchTerm}%`);
            whereClauses.push(`l.nome ILIKE ${pSearch}`);
        }

        // NOVO: Lógica de ordenação para lojas
        switch (sort) {
            case 'rating':
                orderByClause = 'ORDER BY rating_avg DESC, l.nome ASC';
                break;
            case 'distance':
                orderByClause = hasPoint ? 'ORDER BY distance_km ASC, rating_avg DESC' : 'ORDER BY l.nome ASC';
                break;
            default: // relevance
                orderByClause = hasPoint ? 'ORDER BY distance_km ASC, rating_avg DESC' : 'ORDER BY rating_avg DESC, l.nome ASC';
        }

        const sql = `
            SELECT
                l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado,
                COALESCE(rat.rating_avg, 0) as rating_avg,
                ${distanceCalc}
            FROM lojas l
            LEFT JOIN LATERAL (
                SELECT COALESCE(ROUND(AVG(nota)::numeric, 2), 0) AS rating_avg FROM avaliacoes_loja WHERE id_loja = l.id
            ) rat ON TRUE
            WHERE ${whereClauses.join(' AND ')}
            ${orderByClause}
            LIMIT ${pushParam(params, limit)} OFFSET ${pushParam(params, offset)};
        `;

        const { rows } = await pool.query(sql, params);
        return res.json({ page, limit, items: rows });

    } catch (err) {
        console.error('searchStores ->', err);
        return res.status(500).json({ error: 'Erro ao buscar lojas.' });
    }
}
