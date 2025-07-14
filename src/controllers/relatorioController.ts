import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/relatorios/kpis
export const getKpis = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: dayRows } = await pool.query(
      `SELECT COALESCE(SUM(valor_total),0) AS total
       FROM pedidos
       WHERE DATE(criado_em) = CURRENT_DATE;`
    );
    const daySales = parseFloat(dayRows[0].total);

    const { rows: weekRows } = await pool.query(
      `SELECT COALESCE(SUM(valor_total),0) AS total
       FROM pedidos
       WHERE criado_em >= date_trunc('week', CURRENT_DATE);`
    );
    const weekSales = parseFloat(weekRows[0].total);

    const { rows: monthRows } = await pool.query(
      `SELECT COALESCE(SUM(valor_total),0) AS total
       FROM pedidos
       WHERE criado_em >= date_trunc('month', CURRENT_DATE);`
    );
    const monthSales = parseFloat(monthRows[0].total);

    const { rows: avgRows } = await pool.query(
      `SELECT COALESCE(AVG(valor_total),0) AS avg_ticket
       FROM pedidos
       WHERE criado_em >= date_trunc('month', CURRENT_DATE);`
    );
    const ticketAverage = parseFloat(avgRows[0].avg_ticket);

    const { rows: pendingRows } = await pool.query(
      `SELECT COALESCE(SUM(ped.valor_total),0) AS total
       FROM pedidos ped
       JOIN pagamentos pg ON pg.id_pedido = ped.id
       WHERE pg.status_pagamento <> 'paid';`
    );
    const pendingReceipts = parseFloat(pendingRows[0].total);

    res.json({ daySales, weekSales, monthSales, ticketAverage, pendingReceipts });
  } catch (err: any) {
    console.error('Erro ao obter KPIs:', err);
    res.status(500).json({ error: 'Erro interno ao obter KPIs' });
  }
};

// GET /api/relatorios/vendas-por-dia?start=ISO&end=ISO
export const getSalesByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const start = req.query.start as string;
    const end   = req.query.end   as string;
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(DATE(criado_em),'YYYY-MM-DD') AS dia,
         SUM(valor_total)::numeric AS total
       FROM pedidos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY dia
       ORDER BY dia`,
      [start, end]
    );
    const result = rows.map(r => ({ dia: r.dia, total: parseFloat(r.total) }));
    res.json(result);
  } catch (err: any) {
    console.error('Erro ao obter vendas por dia:', err);
    res.status(500).json({ error: 'Erro interno ao obter vendas por dia' });
  }
};