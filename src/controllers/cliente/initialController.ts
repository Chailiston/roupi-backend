import { Request, Response } from 'express'
import { pool } from '../../database/connection'

// helpers
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

/**
 * GET /api/cliente/initial
 * retorna: categorias, lojas em destaque, e **promocoes** (top N) para reduzir chamadas
 */
export async function getInitial(_req: Request, res: Response) {
  try {
    const lojasQ = await pool.query(
      `SELECT l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado,
              COALESCE(ROUND(AVG(al.nota)::numeric, 2), 0)    AS rating_avg,
              COUNT(al.id)                                    AS rating_count,
              COUNT(DISTINCT p.id)                            AS total_produtos
         FROM lojas l
         LEFT JOIN avaliacoes_loja al ON al.id_loja = l.id
         LEFT JOIN produtos p        ON p.id_loja = l.id AND p.ativo = true
        WHERE l.ativo = true
        GROUP BY l.id
        ORDER BY (CASE WHEN COUNT(al.id)=0 THEN 0 ELSE AVG(al.nota) END) DESC,
                 COUNT(al.id) DESC
        LIMIT 12`
    )

    const categoriasQ = await pool.query(
      `SELECT DISTINCT categoria
         FROM produtos
        WHERE ativo = true
          AND categoria IS NOT NULL
          AND categoria <> ''
        ORDER BY categoria`
    )

    // promos resumidas para Home (uma promoção por produto, mais recente)
    const promosQ = await pool.query(
      `SELECT DISTINCT ON (p.id)
              pr.id,
              pr.tipo,
              pr.valor,
              pr.data_inicio,
              pr.data_fim,
              p.id               AS id_produto,
              p.id_loja          AS id_loja,
              p.nome             AS nome_produto,
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
        LIMIT 12`
    )

    return res.json({
      banners: [],
      categorias: categoriasQ.rows.map(r => r.categoria),
      lojas: lojasQ.rows,
      promocoes: promosQ.rows
    })
  } catch (err) {
    console.error('getInitial ->', err)
    return res.status(500).json({ error: 'Erro ao carregar inicial.' })
  }
}

/**
 * GET /api/cliente/stores?name=&address=&categoria=&page=&limit=&sort=
 * sort: "name" | "rating" | "orders" (padrão: rating)
 * **NOVO**: filtro por categoria (ILIKE) sobre produtos ativos da loja
 */
export async function listStores(req: Request, res: Response) {
  try {
    const { name = '', address = '', sort = 'rating', categoria = '' } = req.query as any
    const page = toInt((req.query as any).page, 1)
    const limit = toInt((req.query as any).limit, 20)
    const offset = (page - 1) * limit

    const orderBy =
      String(sort).toLowerCase() === 'name'
        ? `l.nome ASC`
        : String(sort).toLowerCase() === 'orders'
        ? `COALESCE(ped.qtd_pedidos,0) DESC, l.nome ASC`
        : `COALESCE(rat.rating_avg,0) DESC, COALESCE(rat.rating_count,0) DESC, l.nome ASC`

    // Usamos EXISTS para evitar duplicar lojas quando houver muitos produtos na categoria
    const { rows } = await pool.query(
      `
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
      SELECT l.id, l.nome, l.logo_url, l.endereco_cidade, l.endereco_estado, l.ativo,
             COALESCE(rat.rating_avg,0)   AS rating_avg,
             COALESCE(rat.rating_count,0) AS rating_count,
             COALESCE(ped.qtd_pedidos,0)  AS pedidos_total
        FROM lojas l
        LEFT JOIN rat ON rat.id = l.id
        LEFT JOIN ped ON ped.id = l.id
       WHERE l.ativo = true
         AND ($1 = '' OR l.nome ILIKE '%'||$1||'%')
         AND ($2 = '' OR
              l.endereco_rua ILIKE '%'||$2||'%' OR
              l.endereco_bairro ILIKE '%'||$2||'%' OR
              l.endereco_cidade ILIKE '%'||$2||'%' OR
              l.endereco_estado ILIKE '%'||$2||'%')
         AND ($3 = '' OR EXISTS (
              SELECT 1 FROM produtos p
               WHERE p.id_loja = l.id
                 AND p.ativo = true
                 AND p.categoria ILIKE '%'||$3||'%'
         ))
       ORDER BY ${orderBy}
       LIMIT $4 OFFSET $5
      `,
      [name, address, categoria, limit, offset]
    )

    return res.json({ page, limit, items: rows })
  } catch (err) {
    console.error('listStores ->', err)
    return res.status(500).json({ error: 'Erro ao listar lojas.' })
  }
}

/**
 * GET /api/cliente/stores/:id
 * -> dados da loja + produtos ativos + promoções ativas
 */
export async function storeDetails(req: Request, res: Response) {
  try {
    const { id } = req.params

    const lojaQ = await pool.query(
      `WITH rat AS (
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

/**
 * GET /api/cliente/produtos?search=&active=&lojaId=&page=&limit=
 */
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

/**
 * GET /api/cliente/promocoes
 * (continua disponível caso a Home queira mais itens que o /initial retorna)
 */
export async function listPromotions(_req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT pr.id, pr.tipo, pr.valor, pr.data_inicio, pr.data_fim,
              p.id               AS id_produto,
              p.id_loja          AS id_loja,
              p.nome             AS nome_produto,
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
