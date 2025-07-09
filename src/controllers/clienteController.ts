import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar todos os clientes
export const getClientes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE ativo = true');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

// Buscar cliente por ID
export const getClienteById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

// Criar novo cliente
export const createCliente = async (req: Request, res: Response) => {
  const { nome, email, telefone, cpf } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clientes (nome, email, telefone, cpf) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, telefone, cpf]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

// Atualizar dados do cliente
export const updateCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, email, telefone, cpf } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clientes SET nome = $1, email = $2, telefone = $3, cpf = $4 WHERE id = $5 RETURNING *',
      [nome, email, telefone, cpf, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

// Desativar cliente (soft delete)
export const deleteCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE clientes SET ativo = false WHERE id = $1', [id]);
    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desativar cliente' });
  }
};
