import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar todas as avaliações
export const getAvaliacoes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM avaliacoes_produto ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
};

// Listar avaliações por produto
export const getAvaliacoesPorProduto = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM avaliacoes_produto WHERE produto_id = $1 ORDER BY criado_em DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações do produto' });
  }
};

// Criar avaliação
export const createAvaliacao = async (req: Request, res: Response) => {
  const { produto_id, cliente_id, nota, comentario } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO avaliacoes_produto 
       (produto_id, cliente_id, nota, comentario) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [produto_id, cliente_id, nota, comentario]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
};

// Deletar avaliação
export const deleteAvaliacao = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM avaliacoes_produto WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar avaliação' });
  }
};
