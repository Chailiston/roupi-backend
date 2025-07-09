import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar favoritos de um cliente
export const getFavoritosPorCliente = async (req: Request, res: Response) => {
  const { cliente_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT f.*, p.nome, p.preco, p.imagem_url 
       FROM favoritos f 
       JOIN produtos p ON f.produto_id = p.id 
       WHERE f.cliente_id = $1`,
      [cliente_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
};

// Adicionar favorito
export const addFavorito = async (req: Request, res: Response) => {
  const { cliente_id, produto_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO favoritos (cliente_id, produto_id) 
       VALUES ($1, $2) RETURNING *`,
      [cliente_id, produto_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
};

// Remover favorito
export const removeFavorito = async (req: Request, res: Response) => {
  const { cliente_id, produto_id } = req.params;
  try {
    await pool.query(
      `DELETE FROM favoritos WHERE cliente_id = $1 AND produto_id = $2`,
      [cliente_id, produto_id]
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
};
