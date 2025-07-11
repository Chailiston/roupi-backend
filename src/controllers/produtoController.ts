// src/controllers/produtoController.ts
import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/lojas/:lojaId/produtos
export const getProdutosByLoja = async (req: Request, res: Response) => {
  try {
    const { lojaId } = req.params;
    const { rows } = await pool.query(
      'SELECT id, nome, descricao, categoria, preco_base, imagem_url, ativo, criado_em FROM produtos WHERE id_loja = $1 ORDER BY criado_em DESC',
      [lojaId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ error: 'Erro interno ao listar produtos' });
  }
};

// POST /api/lojas/:lojaId/produtos
export const createProduto = async (req: Request, res: Response) => {
  try {
    const { lojaId } = req.params;
    const { nome, descricao, categoria, preco_base, ativo } = req.body;
    const imagemUrl = req.body.imagem_url || null;
    const result = await pool.query(
      `INSERT INTO produtos (id_loja, nome, descricao, categoria, preco_base, imagem_url, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [lojaId, nome, descricao, categoria, preco_base, imagemUrl, ativo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro interno ao criar produto' });
  }
};

// PUT /api/lojas/:lojaId/produtos/:produtoId
export const updateProduto = async (req: Request, res: Response) => {
  try {
    const { lojaId, produtoId } = req.params;
    const { nome, descricao, categoria, preco_base, ativo } = req.body;
    const imagemUrl = req.body.imagem_url || null;
    const result = await pool.query(
      `UPDATE produtos SET
         nome = $1,
         descricao = $2,
         categoria = $3,
         preco_base = $4,
         imagem_url = $5,
         ativo = $6
       WHERE id_loja = $7 AND id = $8
       RETURNING *`,
      [nome, descricao, categoria, preco_base, imagemUrl, ativo, lojaId, produtoId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar produto' });
  }
};