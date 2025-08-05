import { Request, Response } from 'express';
import { pool } from '../database/connection';

// =====================
// Produtos
// =====================

// GET /api/lojas/:lojaId/produtos
export const getProdutosByLoja = async (req: Request, res: Response) => {
  const { lojaId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo,
         criado_em
       FROM produtos
       WHERE id_loja = $1
       ORDER BY criado_em DESC`,
      [lojaId]
    );
    return res.json(rows);
  } catch (err: any) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ error: 'Erro interno ao listar produtos' });
  }
};

// GET /api/lojas/:lojaId/produtos/:produtoId
export const getProdutoById = async (req: Request, res: Response) => {
  const { lojaId, produtoId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo,
         criado_em

       FROM produtos
       WHERE id_loja = $1 AND id = $2`,
      [lojaId, produtoId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(rows[0]);
  } catch (err: any) {
    console.error('Erro ao buscar produto:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar produto' });
  }
};

// POST /api/lojas/:lojaId/produtos
export const createProduto = async (req: Request, res: Response) => {
  const { lojaId } = req.params;
  const { nome, descricao, categoria, preco_base, ativo } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO produtos (
         id_loja,
         nome,
         descricao,
         categoria,
         preco_base,
         ativo
       ) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [lojaId, nome, descricao, categoria, preco_base, ativo]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao criar produto:', err);
    return res.status(500).json({ error: 'Erro interno ao criar produto' });
  }
};

// PUT /api/lojas/:lojaId/produtos/:produtoId
export const updateProduto = async (req: Request, res: Response) => {
  const { lojaId, produtoId } = req.params;
  const { nome, descricao, categoria, preco_base, ativo, imagem_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE produtos SET
         nome       = $1,
         descricao  = $2,
         categoria  = $3,
         preco_base = $4,
         ativo      = $5,
	 imagem_url = $6
       WHERE id_loja = $7
         AND id      = $8
       RETURNING *`,
      [nome, descricao, categoria, preco_base, ativo,imagem_url, lojaId, produtoId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar produto' });
  }
};
