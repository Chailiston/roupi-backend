import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Vendas por loja
export const vendasPorLoja = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM view_vendas_por_loja');
  res.json(result.rows);
};

// Produtos mais vendidos
export const produtosMaisVendidos = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM view_produtos_mais_vendidos');
  res.json(result.rows);
};

// Faturamento por mês
export const faturamentoMensal = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM view_faturamento_por_mes');
  res.json(result.rows);
};

// Clientes mais ativos
export const clientesAtivos = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM view_clientes_ativos');
  res.json(result.rows);
};
