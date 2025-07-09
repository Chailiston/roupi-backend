import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar endereços de um cliente
export const getEnderecosPorCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM enderecos_cliente WHERE cliente_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar endereços' });
  }
};

// Criar endereço
export const createEndereco = async (req: Request, res: Response) => {
  const {
    cliente_id,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO enderecos_cliente 
        (cliente_id, rua, numero, bairro, cidade, estado, cep, complemento) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [cliente_id, rua, numero, bairro, cidade, estado, cep, complemento]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
};

// Atualizar endereço
export const updateEndereco = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    rua,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE enderecos_cliente 
       SET rua = $1, numero = $2, bairro = $3, cidade = $4, estado = $5, cep = $6, complemento = $7
       WHERE id = $8
       RETURNING *`,
      [rua, numero, bairro, cidade, estado, cep, complemento, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
};

// Deletar endereço
export const deleteEndereco = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM enderecos_cliente WHERE id = $1', [id]);
    res.json({ message: 'Endereço deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
};
