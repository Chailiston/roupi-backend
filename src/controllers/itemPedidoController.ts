import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar todos os itens de pedidos (admin/teste)
export const getItensPedido = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM itens_pedido ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
  }
};

// Listar itens por ID de pedido
export const getItensPorPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM itens_pedido WHERE pedido_id = $1 ORDER BY id ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
  }
};

// Criar item do pedido
export const createItemPedido = async (req: Request, res: Response) => {
  const { pedido_id, produto_id, variacao_id, quantidade, preco_unitario } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO itens_pedido 
      (pedido_id, produto_id, variacao_id, quantidade, preco_unitario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [pedido_id, produto_id, variacao_id, quantidade, preco_unitario]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar item ao pedido' });
  }
};

// Atualizar item do pedido
export const updateItemPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantidade, preco_unitario } = req.body;

  try {
    const result = await pool.query(
      `UPDATE itens_pedido 
       SET quantidade = $1, preco_unitario = $2
       WHERE id = $3
       RETURNING *`,
      [quantidade, preco_unitario, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item do pedido' });
  }
};

// Remover item do pedido
export const deleteItemPedido = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM itens_pedido WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item do pedido' });
  }
};
