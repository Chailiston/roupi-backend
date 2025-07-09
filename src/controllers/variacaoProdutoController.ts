import { Request, Response } from 'express';
import { pool } from '../database/connection';

export const getVariacoes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM variacoes_produto');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar variações' });
  }
};

export const createVariacao = async (req: Request, res: Response) => {
  const { produto_id, tamanho, cor, estoque } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO variacoes_produto (produto_id, tamanho, cor, estoque) VALUES ($1, $2, $3, $4) RETURNING *',
      [produto_id, tamanho, cor, estoque]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar variação' });
  }
};
