import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar todos os pedidos
export const getPedidos = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
};

// Buscar pedido por ID
export const getPedidoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
};

// Listar pedidos de um cliente
export const getPedidosPorCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY criado_em DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos do cliente' });
  }
};

// Criar pedido
export const createPedido = async (req: Request, res: Response) => {
  const { cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO pedidos 
      (cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [cliente_id, loja_id, endereco_entrega, valor_total, status_pagamento, forma_pagamento, status_entrega]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

// Atualizar status do pedido
export const updateStatusPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status_pagamento, status_entrega } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pedidos 
       SET status_pagamento = $1, status_entrega = $2
       WHERE id = $3
       RETURNING *`,
      [status_pagamento, status_entrega, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
  }
};
