import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Criar novo chamado
export const createChamado = async (req: Request, res: Response) => {
  const { cliente_id, assunto, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO chamados (cliente_id, assunto, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [cliente_id, assunto, status || 'aberto']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar chamado' });
  }
};

// Listar chamados por cliente
export const getChamadosPorCliente = async (req: Request, res: Response) => {
  const { cliente_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM chamados WHERE cliente_id = $1 ORDER BY criado_em DESC`,
      [cliente_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar chamados' });
  }
};

// Listar todas as mensagens de um chamado
export const getMensagensChamado = async (req: Request, res: Response) => {
  const { chamado_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM mensagens_chamado WHERE chamado_id = $1 ORDER BY criado_em ASC`,
      [chamado_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar mensagens do chamado' });
  }
};

// Enviar mensagem para chamado
export const createMensagemChamado = async (req: Request, res: Response) => {
  const { chamado_id, remetente, mensagem } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mensagens_chamado (chamado_id, remetente, mensagem)
       VALUES ($1, $2, $3) RETURNING *`,
      [chamado_id, remetente, mensagem]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};
