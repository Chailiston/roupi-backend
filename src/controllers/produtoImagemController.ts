import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/lojas/:lojaId/produtos/:produtoId/imagens
export const getImagensByProduto = async (req: Request, res: Response) => {
  const { produtoId } = req.params;
  const { rows } = await pool.query(
    'SELECT id, url, ordem FROM produtos_imagens WHERE id_produto=$1 ORDER BY ordem',
    [produtoId]
  );
  res.json(rows);
};

// POST /api/lojas/:lojaId/produtos/:produtoId/imagens
export const addImagemProduto = async (req: Request, res: Response) => {
  const { produtoId } = req.params;
  const { url, ordem } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO produtos_imagens (id_produto,url,ordem) VALUES($1,$2,$3) RETURNING *',
    [produtoId, url, ordem ?? 0]
  );
  res.status(201).json(rows[0]);
};

// DELETE /api/lojas/:lojaId/produtos/:produtoId/imagens/:imgId
export const deleteImagem = async (req: Request, res: Response) => {
  const { imgId } = req.params;
  await pool.query('DELETE FROM produtos_imagens WHERE id=$1', [imgId]);
  res.status(204).send();
};
