import { Request, Response } from 'express';
import { pool } from '../database/connection';

interface PromoBody {
  tipo: 'percentual' | 'valor_fixo' | 'combo';
  valor?: number | null;
  data_inicio: string;
  data_fim: string;
  estoque_maximo?: number | null;
  ativo?: boolean;
  produtos?: number[];
}

// GET /api/promocoes
export const getPromocoes = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em FROM promocoes ORDER BY id'
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao listar promoções:', err);
    res.status(500).json({ error: 'Erro interno ao listar promoções' });
  }
};

// GET /api/promocoes/:id
export const getPromocaoById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      'SELECT id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em FROM promocoes WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }

    const promo = result.rows[0] as any;
    const produtosQ = await pool.query<{ id_produto: number }>(
      'SELECT id_produto FROM promocao_produtos WHERE id_promocao = $1',
      [id]
    );
    promo.produtos = produtosQ.rows.map(r => r.id_produto);

    res.json(promo);
  } catch (err: any) {
    console.error('Erro ao buscar promoção:', err);
    res.status(500).json({ error: 'Erro interno ao buscar promoção' });
  }
};

// POST /api/promocoes
export const createPromocao = async (req: Request<{}, {}, PromoBody>, res: Response) => {
  try {
    const {
      tipo,
      valor = null,
      data_inicio,
      data_fim,
      estoque_maximo = null,
      ativo = true,
      produtos = []
    } = req.body;

    const result = await pool.query(
      `INSERT INTO promocoes
         (tipo, valor, data_inicio, data_fim, estoque_maximo, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em`,
      [tipo, valor, data_inicio, data_fim, estoque_maximo, ativo]
    );
    const promo = result.rows[0] as any;

    for (const pid of produtos) {
      await pool.query(
        'INSERT INTO promocao_produtos (id_promocao, id_produto) VALUES ($1, $2)',
        [promo.id, pid]
      );
    }

    res.status(201).json(promo);
  } catch (err: any) {
    console.error('Erro ao criar promoção:', err);
    res.status(500).json({ error: 'Erro interno ao criar promoção' });
  }
};

// PUT /api/promocoes/:id
export const updatePromocao = async (
  req: Request<{ id: string }, {}, PromoBody>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      tipo,
      valor = null,
      data_inicio,
      data_fim,
      estoque_maximo = null,
      ativo = true,
      produtos = []
    } = req.body;

    const result = await pool.query(
      `UPDATE promocoes SET
         tipo = $1,
         valor = $2,
         data_inicio = $3,
         data_fim = $4,
         estoque_maximo = $5,
         ativo = $6,
         atualizado_em = NOW()
       WHERE id = $7
       RETURNING id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em`,
      [tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }

    // Sincroniza produtos
    await pool.query('DELETE FROM promocao_produtos WHERE id_promocao = $1', [id]);
    for (const pid of produtos) {
      await pool.query(
        'INSERT INTO promocao_produtos (id_promocao, id_produto) VALUES ($1, $2)',
        [id, pid]
      );
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao atualizar promoção:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar promoção' });
  }
};

// PATCH /api/promocoes/:id/ativo
export const toggleAtivo = async (
  req: Request<{ id: string }, {}, { ativo: boolean }>,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { ativo } = req.body;
    const result = await pool.query(
      `UPDATE promocoes
         SET ativo = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [ativo, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    res.sendStatus(204);
  } catch (err: any) {
    console.error('Erro ao toggle de ativo:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar status' });
  }
};

// DELETE /api/promocoes/:id
export const deletePromocao = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query('DELETE FROM promocoes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    await pool.query('DELETE FROM promocao_produtos WHERE id_promocao = $1', [id]);
    res.sendStatus(204);
  } catch (err: any) {
    console.error('Erro ao excluir promoção:', err);
    res.status(500).json({ error: 'Erro interno ao excluir promoção' });
  }
};
