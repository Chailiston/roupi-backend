import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar notificações por cliente
export const getNotificacoesPorCliente = async (req: Request, res: Response) => {
  const { cliente_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM notificacoes
       WHERE cliente_id = $1
       ORDER BY criado_em DESC`,
      [cliente_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// Criar nova notificação
export const createNotificacao = async (req: Request, res: Response) => {
  const { cliente_id, titulo, mensagem } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notificacoes (cliente_id, titulo, mensagem)
       VALUES ($1, $2, $3) RETURNING *`,
      [cliente_id, titulo, mensagem]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar notificação' });
  }
};

// Marcar como lida
export const marcarComoLida = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notificacoes SET lida = true WHERE id = $1`,
      [id]
    );
    res.status(200).json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
};
