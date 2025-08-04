import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/lojas/:lojaId/produtos/:produtoId/imagens
export const getImagensByProduto = async (req: Request, res: Response) => {
  const { produtoId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, url, ordem
       FROM produtos_imagens
       WHERE id_produto = $1
       ORDER BY ordem ASC
       LIMIT 10`,
      [produtoId]
    );
    return res.json(rows);
  } catch (err: any) {
    console.error('Erro ao listar imagens do produto:', err);
    return res.status(500).json({ error: 'Erro interno ao listar imagens' });
  }
};

// POST /api/lojas/:lojaId/produtos/:produtoId/imagens
export const addImagemProduto = async (req: Request, res: Response) => {
  const { produtoId } = req.params;
  const { url } = req.body;

  try {
    // garante no máximo 10 imagens
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM produtos_imagens
       WHERE id_produto = $1`,
      [produtoId]
    );
    if (countRes.rows[0].cnt >= 10) {
      return res.status(400).json({ error: 'Limite de 10 imagens por produto atingido' });
    }

    // nova ordem = maior ordem atual + 1
    const maxRes = await pool.query(
      `SELECT COALESCE(MAX(ordem), -1)::int AS max_ordem
       FROM produtos_imagens
       WHERE id_produto = $1`,
      [produtoId]
    );
    const nextOrdem = maxRes.rows[0].max_ordem + 1;

    const result = await pool.query(
      `INSERT INTO produtos_imagens (
         id_produto,
         url,
         ordem
       ) VALUES ($1,$2,$3)
       RETURNING id, url, ordem`,
      [produtoId, url, nextOrdem]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Erro ao adicionar imagem ao produto:', err);
    return res.status(500).json({ error: 'Erro interno ao adicionar imagem' });
  }
};

// DELETE /api/lojas/:lojaId/produtos/:produtoId/imagens/:imagemId
export const deleteImagemProduto = async (req: Request, res: Response) => {
  const { produtoId, imagemId } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM produtos_imagens
       WHERE id_produto = $1
         AND id         = $2
       RETURNING id`,
      [produtoId, imagemId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    return res.json({ message: 'Imagem excluída com sucesso' });
  } catch (err: any) {
    console.error('Erro ao excluir imagem do produto:', err);
    return res.status(500).json({ error: 'Erro interno ao excluir imagem' });
  }
};

// PUT /api/lojas/:lojaId/produtos/:produtoId/imagens/:imagemId/capa
export const setCoverImage = async (req: Request, res: Response) => {
  const { produtoId, imagemId } = req.params;
  try {
    await pool.query(
      `UPDATE produtos_imagens
       SET ordem = CASE
         WHEN id = $1 THEN 0
         ELSE ordem + 1
       END
       WHERE id_produto = $2`,
      [imagemId, produtoId]
    );
    return res.json({ message: 'Imagem de capa atualizada' });
  } catch (err: any) {
    console.error('Erro ao definir imagem de capa:', err);
    return res.status(500).json({ error: 'Erro interno ao definir capa' });
  }
};
