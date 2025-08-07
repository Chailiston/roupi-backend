// src/controllers/relatorioController.ts
import { Request, Response } from 'express';
import { pool } from '../database/connection';

// 1. Relatórios de Vendas e Receita

// 1.1 Sales Summary: totais e contagem para hoje, semana, mês e ano
export const getSalesSummary = async (_req: Request, res: Response) => {
  try {
    const [
      dayQuery,
      weekQuery,
      monthQuery,
      yearQuery
    ] = await Promise.all([
      pool.query(
        `SELECT 
           COALESCE(SUM(valor_total),0) AS total, 
           COUNT(*)           AS count
         FROM pedidos 
         WHERE DATE(criado_em) = CURRENT_DATE;`
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(valor_total),0) AS total, 
           COUNT(*)           AS count
         FROM pedidos 
         WHERE criado_em >= date_trunc('week', CURRENT_DATE);`
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(valor_total),0) AS total, 
           COUNT(*)           AS count
         FROM pedidos 
         WHERE criado_em >= date_trunc('month', CURRENT_DATE);`
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(valor_total),0) AS total, 
           COUNT(*)           AS count
         FROM pedidos 
         WHERE criado_em >= date_trunc('year', CURRENT_DATE);`
      )
    ]);

    const format = (r: { total: string; count: string }) => ({
      total: parseFloat(r.total),
      count: parseInt(r.count, 10)
    });

    res.json({
      daily:   format(dayQuery.rows[0]),
      weekly:  format(weekQuery.rows[0]),
      monthly: format(monthQuery.rows[0]),
      yearly:  format(yearQuery.rows[0])
    });
  } catch (err: any) {
    console.error('Erro ao obter Sales Summary:', err);
    res.status(500).json({ error: 'Erro interno ao obter Sales Summary' });
  }
};

// 1.2 Evolução do Ticket Médio por dia (entre start/end)
export const getTicketEvolution = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT 
         TO_CHAR(DATE(criado_em),'YYYY-MM-DD') AS day,
         AVG(valor_total)::numeric AS avg_ticket
       FROM pedidos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY day
       ORDER BY day`,
      [start, end]
    );
    res.json(rows.map(r => ({
      day: r.day,
      avgTicket: parseFloat(r.avg_ticket)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Ticket Evolution:', err);
    res.status(500).json({ error: 'Erro interno ao obter Ticket Evolution' });
  }
};

// 1.3 Top 10 Produtos Mais Vendidos
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT p.nome,
              SUM(i.quantidade)::bigint AS quantidade
       FROM itens_pedido i
       JOIN pedidos ped ON ped.id = i.id_pedido
       JOIN produtos p ON p.id = i.id_produto
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY p.nome
       ORDER BY quantidade DESC
       LIMIT 10`,
      [start, end]
    );
    res.json(rows.map(r => ({
      nome: r.nome,
      quantidade: parseInt(r.quantidade, 10)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Top Products:', err);
    res.status(500).json({ error: 'Erro interno ao obter Top Products' });
  }
};

// 1.4 Vendas por Categoria
export const getSalesByCategory = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT p.categoria,
              SUM(i.quantidade)          AS total_quantity,
              SUM(i.quantidade * i.preco_unitario)::numeric AS total_revenue
       FROM itens_pedido i
       JOIN pedidos ped ON ped.id = i.id_pedido
       JOIN produtos p ON p.id = i.id_produto
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY p.categoria
       ORDER BY total_quantity DESC`,
      [start, end]
    );
    res.json(rows.map(r => ({
      categoria: r.categoria,
      quantidade: parseInt(r.total_quantity, 10),
      receita: parseFloat(r.total_revenue)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Sales By Category:', err);
    res.status(500).json({ error: 'Erro interno ao obter Sales By Category' });
  }
};

// 1.5 Vendas por Loja (canal)
export const getSalesByStore = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT ped.id_loja,
              SUM(ped.valor_total)::numeric AS total_revenue,
              COUNT(*)             AS orders_count
       FROM pedidos ped
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY ped.id_loja
       ORDER BY total_revenue DESC`,
      [start, end]
    );
    res.json(rows.map(r => ({
      lojaId: parseInt(r.id_loja, 10),
      receita: parseFloat(r.total_revenue),
      pedidos: parseInt(r.orders_count, 10)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Sales By Store:', err);
    res.status(500).json({ error: 'Erro interno ao obter Sales By Store' });
  }
};

// 2. Relatórios Financeiros

// 2.1 Recebimentos Pendentes vs Concluídos
export const getReceiptsSummary = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT
         SUM(CASE WHEN pg.status_pagamento = 'paid' THEN ped.valor_total ELSE 0 END)::numeric AS paid_total,
         SUM(CASE WHEN pg.status_pagamento <> 'paid' THEN ped.valor_total ELSE 0 END)::numeric AS pending_total
       FROM pagamentos pg
       JOIN pedidos ped ON ped.id = pg.id_pedido
       WHERE ped.criado_em BETWEEN $1 AND $2;`,
      [start, end]
    );
    const r = rows[0];
    res.json({
      paid:    parseFloat(r.paid_total),
      pending: parseFloat(r.pending_total)
    });
  } catch (err: any) {
    console.error('Erro ao obter Receipts Summary:', err);
    res.status(500).json({ error: 'Erro interno ao obter Receipts Summary' });
  }
};

// 2.2 Fluxo de Caixa Projetado (recebimentos por mês)
export const getCashFlowProjection = async (req: Request, res: Response) => {
  try {
    const { months = '6' } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(pg.criado_em, 'YYYY-MM') AS month,
         SUM(ped.valor_total)::numeric AS projected_cash_in
       FROM pagamentos pg
       JOIN pedidos ped ON ped.id = pg.id_pedido
       GROUP BY month
       ORDER BY month DESC
       LIMIT $1;`,
      [parseInt(months, 10)]
    );
    res.json(rows.map(r => ({
      month: r.month,
      value: parseFloat(r.projected_cash_in)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Cash Flow Projection:', err);
    res.status(500).json({ error: 'Erro interno ao obter Cash Flow Projection' });
  }
};

// 2.3 Histórico de Alterações de Preço
export const getPriceHistory = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_produto, preco_antigo, preco_novo, alterado_em
       FROM preco_historico
       ORDER BY alterado_em DESC;`
    );
    res.json(rows.map(r => ({
      produtoId: r.id_produto,
      oldPrice:  parseFloat(r.preco_antigo),
      newPrice:  parseFloat(r.preco_novo),
      changedAt: r.alterado_em
    })));
  } catch (err: any) {
    console.error('Erro ao obter Price History:', err);
    res.status(500).json({ error: 'Erro interno ao obter Price History' });
  }
};

// 3. Relatórios de Estoque e Inventário

// 3.1 Nível de Estoque Atual por Variação
export const getStockLevels = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_variacao_produto, quantidade
       FROM estoque_variacao;`
    );
    res.json(rows.map(r => ({
      variationId: r.id_variacao_produto,
      stock:       parseInt(r.quantidade, 10)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Stock Levels:', err);
    res.status(500).json({ error: 'Erro interno ao obter Stock Levels' });
  }
};

// 3.2 Itens em Alerta Crítico
export const getCriticalStockItems = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_variacao_produto, quantidade, minimo_critico
       FROM estoque_variacao
       WHERE quantidade <= minimo_critico;`
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Critical Stock Items:', err);
    res.status(500).json({ error: 'Erro interno ao obter Critical Stock Items' });
  }
};

// 3.3 Lead Time de Reposição
export const getReorderLeadTimes = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_variacao_produto, lead_time_dias
       FROM estoque_variacao;`
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Reorder Lead Times:', err);
    res.status(500).json({ error: 'Erro interno ao obter Reorder Lead Times' });
  }
};

// 3.4 Rotatividade de Estoque (último mês)
export const getStockTurnover = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `WITH sales AS (
         SELECT SUM(i.quantidade)::numeric AS sold
         FROM itens_pedido i
         JOIN pedidos ped ON ped.id = i.id_pedido
         WHERE ped.criado_em >= now() - INTERVAL '1 month'
       ), avg_stock AS (
         SELECT AVG(quantidade)::numeric AS avg_stock
         FROM estoque_variacao
       )
       SELECT (sold / NULLIF(avg_stock,0)) AS turnover_rate
       FROM sales, avg_stock;`
    );
    res.json({ turnoverRate: parseFloat(rows[0].turnover_rate) });
  } catch (err: any) {
    console.error('Erro ao obter Stock Turnover:', err);
    res.status(500).json({ error: 'Erro interno ao obter Stock Turnover' });
  }
};

// 4. Relatórios de Promoções e Descontos

// 4.1 Uso de Promoções
export const getPromotionUsage = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT pp.id_promocao,
              COUNT(DISTINCT ped.id)::bigint AS usage_count
       FROM promocao_produtos pp
       JOIN itens_pedido i ON i.id_produto = pp.id_produto
       JOIN pedidos ped ON ped.id = i.id_pedido
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY pp.id_promocao
       ORDER BY usage_count DESC;`,
      [start, end]
    );
    res.json(rows.map(r => ({
      promocaoId: parseInt(r.id_promocao, 10),
      usageCount: parseInt(r.usage_count, 10)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Promotion Usage:', err);
    res.status(500).json({ error: 'Erro interno ao obter Promotion Usage' });
  }
};

// 4.2 Impacto no Ticket Médio (com vs sem promoção)
export const getPromotionTicketImpact = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT
         AVG(CASE WHEN EXISTS(
           SELECT 1 FROM promocao_produtos pp
           JOIN itens_pedido ip ON ip.id_produto = pp.id_produto
           WHERE ip.id_pedido = ped.id
         ) THEN ped.valor_total END)::numeric AS avg_with_promo,
         AVG(CASE WHEN NOT EXISTS(
           SELECT 1 FROM promocao_produtos pp
           JOIN itens_pedido ip ON ip.id_produto = pp.id_produto
           WHERE ip.id_pedido = ped.id
         ) THEN ped.valor_total END)::numeric AS avg_without_promo
       FROM pedidos ped
       WHERE ped.criado_em BETWEEN $1 AND $2;`,
      [start, end]
    );
    const r = rows[0];
    res.json({
      withPromotion:    parseFloat(r.avg_with_promo),
      withoutPromotion: parseFloat(r.avg_without_promo)
    });
  } catch (err: any) {
    console.error('Erro ao obter Promotion Ticket Impact:', err);
    res.status(500).json({ error: 'Erro interno ao obter Promotion Ticket Impact' });
  }
};

// 4.3 Vendas Incrementais por Promoção (stub)
export const getPromotionIncrementalSales = async (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented: Promotion Incremental Sales' });
};

// 5. Relatórios de Clientes e Engajamento

// 5.1 Novos vs Clientes Ativos
export const getCustomerAcquisition = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const [{ rows: newRows }, { rows: activeRows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS new_customers
         FROM clientes
         WHERE criado_em BETWEEN $1 AND $2;`,
        [start, end]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT id_cliente)::int AS active_customers
         FROM pedidos
         WHERE criado_em BETWEEN $1 AND $2;`,
        [start, end]
      )
    ]);
    res.json({
      newCustomers:    newRows[0].new_customers,
      activeCustomers: activeRows[0].active_customers
    });
  } catch (err: any) {
    console.error('Erro ao obter Customer Acquisition:', err);
    res.status(500).json({ error: 'Erro interno ao obter Customer Acquisition' });
  }
};

// 5.2 Top Clientes por Receita
export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT ped.id_cliente,
              SUM(ped.valor_total)::numeric AS total_spent
       FROM pedidos ped
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY ped.id_cliente
       ORDER BY total_spent DESC
       LIMIT 10;`,
      [start, end]
    );
    res.json(rows.map(r => ({
      clienteId: parseInt(r.id_cliente, 10),
      spent:     parseFloat(r.total_spent)
    })));
  } catch (err: any) {
    console.error('Erro ao obter Top Customers:', err);
    res.status(500).json({ error: 'Erro interno ao obter Top Customers' });
  }
};

// 5.3 Distribuição Geográfica
export const getGeoDistribution = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT e.cidade,
              COUNT(*)::int AS orders_count
       FROM pedidos ped
       JOIN enderecos_cliente e ON e.id = ped.id_endereco_entrega
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY e.cidade
       ORDER BY orders_count DESC;`,
      [start, end]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Geo Distribution:', err);
    res.status(500).json({ error: 'Erro interno ao obter Geo Distribution' });
  }
};

// 5.4 Produtos Favoritados
export const getFavoritedProducts = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const { rows } = await pool.query(
      `SELECT id_produto,
              COUNT(*)::int AS favorites_count
       FROM favoritos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY id_produto
       ORDER BY favorites_count DESC;`,
      [start, end]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Favorited Products:', err);
    res.status(500).json({ error: 'Erro interno ao obter Favorited Products' });
  }
};

// 5.5 Abandono de Carrinho
export const getCartAbandonment = async (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented: Cart Abandonment' });
};

// 6. Relatórios de Atendimento e Feedback

// 6.1 Avaliações de Loja e Produto
export const getRatingsSummary = async (_req: Request, res: Response) => {
  try {
    const [{ rows: lojaRows }, { rows: prodRows }] = await Promise.all([
      pool.query(
        `SELECT 
           AVG(nota)::numeric AS avg_loja,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_loja
         FROM avaliacoes_loja;`
      ),
      pool.query(
        `SELECT 
           AVG(nota)::numeric AS avg_produto,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_produto
         FROM avaliacoes_produto;`
      )
    ]);
    res.json({
      loja:    lojaRows[0],
      produto: prodRows[0]
    });
  } catch (err: any) {
    console.error('Erro ao obter Ratings Summary:', err);
    res.status(500).json({ error: 'Erro interno ao obter Ratings Summary' });
  }
};

// 6.2 Tempo de Resposta a Avaliações
export const getRatingResponseTime = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         AVG(EXTRACT(EPOCH FROM (resposta_loja_ts - criado_em)))::numeric AS avg_response_secs
       FROM (
         SELECT 
           criado_em, 
           CAST(resposta_loja AS timestamp) AS resposta_loja_ts
         FROM avaliacoes_loja
         WHERE resposta_loja IS NOT NULL
       ) sub;`
    );
    res.json({ avgResponseSecs: parseFloat(rows[0].avg_response_secs) });
  } catch (err: any) {
    console.error('Erro ao obter Rating Response Time:', err);
    res.status(500).json({ error: 'Erro interno ao obter Rating Response Time' });
  }
};

// 6.3 Chamados de Suporte
export const getSupportTicketsVolume = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT status,
              COUNT(*)::int AS count
       FROM chamados
       GROUP BY status;`
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Support Tickets Volume:', err);
    res.status(500).json({ error: 'Erro interno ao obter Support Tickets Volume' });
  }
};

// 6.4 Tempo Médio de Resolução de Chamados
export const getTicketResolutionTime = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         AVG(EXTRACT(EPOCH FROM (atualizado_em - criado_em)))::numeric AS avg_resolution_secs
       FROM chamados
       WHERE status <> 'aberto';`
    );
    res.json({ avgResolutionSecs: parseFloat(rows[0].avg_resolution_secs) });
  } catch (err: any) {
    console.error('Erro ao obter Ticket Resolution Time:', err);
    res.status(500).json({ error: 'Erro interno ao obter Ticket Resolution Time' });
  }
};

// 6.5 Notificações Enviadas vs. Lidas
export const getNotificationsStats = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE lida = false)::int AS unread,
         COUNT(*) FILTER (WHERE lida = true)::int  AS read
       FROM notificacoes;`
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Erro ao obter Notifications Stats:', err);
    res.status(500).json({ error: 'Erro interno ao obter Notifications Stats' });
  }
};

// 7. Relatórios de Pagamentos e Conversão

// 7.1 Métodos de Pagamento Mais Usados
export const getPaymentMethodsUsage = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT metodo_pagamento,
              COUNT(*)::int AS count
       FROM pagamentos
       GROUP BY metodo_pagamento
       ORDER BY count DESC;`
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Erro ao obter Payment Methods Usage:', err);
    res.status(500).json({ error: 'Erro interno ao obter Payment Methods Usage' });
  }
};

// 7.2 Taxa de Conversão de Pagamento
export const getPaymentConversionRate = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as Record<string,string>;
    const [{ rows: orderRows }, { rows: paymentRows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_orders
         FROM pedidos
         WHERE criado_em BETWEEN $1 AND $2;`,
        [start, end]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS paid_payments
         FROM pagamentos pg
         JOIN pedidos ped ON ped.id = pg.id_pedido
         WHERE pg.status_pagamento = 'paid'
           AND ped.criado_em     BETWEEN $1 AND $2;`,
        [start, end]
      )
    ]);
    const totalOrders = orderRows[0].total_orders;
    const paid = paymentRows[0].paid_payments;
    res.json({
      totalOrders,
      paid,
      conversionRate: totalOrders > 0 ? paid / totalOrders : 0
    });
  } catch (err: any) {
    console.error('Erro ao obter Payment Conversion Rate:', err);
    res.status(500).json({ error: 'Erro interno ao obter Payment Conversion Rate' });
  }
};

// 7.3 Estatísticas de QR Code / URL de Pagamento
export const getQRCodeStats = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE qr_code IS NOT NULL)::int    AS qr_count,
         COUNT(*) FILTER (WHERE url_pagamento IS NOT NULL)::int AS url_count
       FROM pagamentos;`
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Erro ao obter QRCode Stats:', err);
    res.status(500).json({ error: 'Erro interno ao obter QRCode Stats' });
  }
};
