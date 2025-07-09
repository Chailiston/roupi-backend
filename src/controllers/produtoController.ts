import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Listar todos os produtos
export const getProdutos = async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM produtos WHERE ativo = true ORDER BY id DESC');
  res.json(result.rows);
};

// Buscar produto por ID
export const getProdutoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
  res.json(result.rows[0]);
};

// Listar produtos por loja
export const getProdutosByLoja = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM produtos WHERE loja_id = $1 AND ativo = true ORDER BY id DESC', [id]);
  res.json(result.rows);
};

// Criar produto
export const createProduto = async (req: Request, res: Response) => {
  const { loja_id, nome, descricao, preco, categoria, destaque } = req.body;

  const result = await pool.query(
    `INSERT INTO produtos (loja_id, nome, descricao, preco, categoria, destaque)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [loja_id, nome, descricao, preco, categoria, destaque]
  );

  res.status(201).json(result.rows[0]);
};

// Atualizar produto
export const updateProduto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, destaque } = req.body;

  const result = await pool.query(
    `UPDATE produtos SET nome = $1, descricao = $2, preco = $3, categoria = $4, destaque = $5
     WHERE id = $6 RETURNING *`,
    [nome, descricao, preco, categoria, destaque, id]
  );

  res.json(result.rows[0]);
};

// Desativar produto (soft delete)
export const deleteProduto = async (req: Request, res: Response) => {
  const { id } = req.params;

  await pool.query(`UPDATE produtos SET ativo = false WHERE id = $1`, [id]);

  res.json({ message: 'Produto desativado com sucesso.' });
};
