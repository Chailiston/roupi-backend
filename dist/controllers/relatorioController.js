"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQRCodeStats = exports.getPaymentConversionRate = exports.getPaymentMethodsUsage = exports.getNotificationsStats = exports.getTicketResolutionTime = exports.getSupportTicketsVolume = exports.getRatingResponseTime = exports.getRatingsSummary = exports.getCartAbandonment = exports.getFavoritedProducts = exports.getGeoDistribution = exports.getTopCustomers = exports.getCustomerAcquisition = exports.getPromotionIncrementalSales = exports.getPromotionTicketImpact = exports.getPromotionUsage = exports.getStockTurnover = exports.getReorderLeadTimes = exports.getCriticalStockItems = exports.getStockLevels = exports.getPriceHistory = exports.getCashFlowProjection = exports.getReceiptsSummary = exports.getSalesByStore = exports.getSalesByCategory = exports.getTopProducts = exports.getSalesByDay = exports.getTicketEvolution = exports.getSalesSummary = void 0;
const connection_1 = require("../database/connection");
// 1. Relatórios de Vendas e Receita
// 1.1 Sales Summary: totais e contagem para hoje, semana, mês e ano
const getSalesSummary = async (_req, res) => {
    try {
        const [dayQuery, weekQuery, monthQuery, yearQuery] = await Promise.all([
            connection_1.pool.query(`SELECT COALESCE(SUM(valor_total),0) AS total,
                COUNT(*)           AS count
         FROM pedidos
         WHERE DATE(criado_em) = CURRENT_DATE;`),
            connection_1.pool.query(`SELECT COALESCE(SUM(valor_total),0) AS total,
                COUNT(*)           AS count
         FROM pedidos
         WHERE criado_em >= date_trunc('week', CURRENT_DATE);`),
            connection_1.pool.query(`SELECT COALESCE(SUM(valor_total),0) AS total,
                COUNT(*)           AS count
         FROM pedidos
         WHERE criado_em >= date_trunc('month', CURRENT_DATE);`),
            connection_1.pool.query(`SELECT COALESCE(SUM(valor_total),0) AS total,
                COUNT(*)           AS count
         FROM pedidos
         WHERE criado_em >= date_trunc('year', CURRENT_DATE);`)
        ]);
        const format = (r) => ({
            total: parseFloat(r.total),
            count: parseInt(r.count, 10)
        });
        res.json({
            daily: format(dayQuery.rows[0]),
            weekly: format(weekQuery.rows[0]),
            monthly: format(monthQuery.rows[0]),
            yearly: format(yearQuery.rows[0])
        });
    }
    catch (err) {
        console.error('Erro ao obter Sales Summary:', err);
        res.status(500).json({ error: 'Erro interno ao obter Sales Summary' });
    }
};
exports.getSalesSummary = getSalesSummary;
// 1.2 Evolução do Ticket Médio por dia (entre start/end)
const getTicketEvolution = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT TO_CHAR(DATE(criado_em),'YYYY-MM-DD') AS day,
              AVG(valor_total)::numeric AS avg_ticket
       FROM pedidos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY day
       ORDER BY day`, [start, end]);
        res.json(rows.map(r => ({
            day: r.day,
            avgTicket: parseFloat(r.avg_ticket)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Ticket Evolution:', err);
        res.status(500).json({ error: 'Erro interno ao obter Ticket Evolution' });
    }
};
exports.getTicketEvolution = getTicketEvolution;
// 1.3 Vendas por Dia (entre start/end)
const getSalesByDay = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT TO_CHAR(DATE(criado_em),'YYYY-MM-DD') AS dia,
              SUM(valor_total)::numeric                 AS total
       FROM pedidos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY dia
       ORDER BY dia`, [start, end]);
        res.json(rows.map(r => ({
            dia: r.dia,
            total: parseFloat(r.total)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Vendas por dia:', err);
        res.status(500).json({ error: 'Erro interno ao obter Vendas por dia' });
    }
};
exports.getSalesByDay = getSalesByDay;
// 1.4 Top 10 Produtos Mais Vendidos
const getTopProducts = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT p.nome,
              SUM(i.quantidade)::bigint AS quantidade
       FROM itens_pedido i
       JOIN pedidos ped ON ped.id = i.id_pedido
       JOIN produtos p ON p.id = i.id_produto
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY p.nome
       ORDER BY quantidade DESC
       LIMIT 10`, [start, end]);
        res.json(rows.map(r => ({
            nome: r.nome,
            quantidade: parseInt(r.quantidade, 10)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Top Products:', err);
        res.status(500).json({ error: 'Erro interno ao obter Top Products' });
    }
};
exports.getTopProducts = getTopProducts;
// 1.5 Vendas por Categoria
const getSalesByCategory = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT p.categoria,
              SUM(i.quantidade)                              AS total_quantity,
              SUM(i.quantidade * i.preco_unitario)::numeric  AS total_revenue
       FROM itens_pedido i
       JOIN pedidos ped ON ped.id = i.id_pedido
       JOIN produtos p ON p.id = i.id_produto
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY p.categoria
       ORDER BY total_quantity DESC`, [start, end]);
        res.json(rows.map(r => ({
            categoria: r.categoria,
            quantidade: parseInt(r.total_quantity, 10),
            receita: parseFloat(r.total_revenue)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Sales By Category:', err);
        res.status(500).json({ error: 'Erro interno ao obter Sales By Category' });
    }
};
exports.getSalesByCategory = getSalesByCategory;
// 1.6 Vendas por Loja (canal)
const getSalesByStore = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT ped.id_loja,
              SUM(ped.valor_total)::numeric AS total_revenue,
              COUNT(*)             AS orders_count
       FROM pedidos ped
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY ped.id_loja
       ORDER BY total_revenue DESC`, [start, end]);
        res.json(rows.map(r => ({
            lojaId: parseInt(r.id_loja, 10),
            receita: parseFloat(r.total_revenue),
            pedidos: parseInt(r.orders_count, 10)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Sales By Store:', err);
        res.status(500).json({ error: 'Erro interno ao obter Sales By Store' });
    }
};
exports.getSalesByStore = getSalesByStore;
// ... (as demais funções continuam inalteradas)
// 2. Relatórios Financeiros
// 2.1 Recebimentos Pendentes vs Concluídos
const getReceiptsSummary = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT
         SUM(CASE WHEN pg.status_pagamento = 'paid' THEN ped.valor_total ELSE 0 END)::numeric AS paid_total,
         SUM(CASE WHEN pg.status_pagamento <> 'paid' THEN ped.valor_total ELSE 0 END)::numeric AS pending_total
       FROM pagamentos pg
       JOIN pedidos ped ON ped.id = pg.id_pedido
       WHERE ped.criado_em BETWEEN $1 AND $2;`, [start, end]);
        const r = rows[0];
        res.json({
            paid: parseFloat(r.paid_total),
            pending: parseFloat(r.pending_total)
        });
    }
    catch (err) {
        console.error('Erro ao obter Receipts Summary:', err);
        res.status(500).json({ error: 'Erro interno ao obter Receipts Summary' });
    }
};
exports.getReceiptsSummary = getReceiptsSummary;
// 2.2 Fluxo de Caixa Projetado (recebimentos por mês)
const getCashFlowProjection = async (req, res) => {
    try {
        const { months = '6' } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT
         TO_CHAR(pg.criado_em, 'YYYY-MM') AS month,
         SUM(ped.valor_total)::numeric AS projected_cash_in
       FROM pagamentos pg
       JOIN pedidos ped ON ped.id = pg.id_pedido
       GROUP BY month
       ORDER BY month DESC
       LIMIT $1;`, [parseInt(months, 10)]);
        res.json(rows.map(r => ({
            month: r.month,
            value: parseFloat(r.projected_cash_in)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Cash Flow Projection:', err);
        res.status(500).json({ error: 'Erro interno ao obter Cash Flow Projection' });
    }
};
exports.getCashFlowProjection = getCashFlowProjection;
// 2.3 Histórico de Alterações de Preço
const getPriceHistory = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT id_produto, preco_antigo, preco_novo, alterado_em
       FROM preco_historico
       ORDER BY alterado_em DESC;`);
        res.json(rows.map(r => ({
            produtoId: r.id_produto,
            oldPrice: parseFloat(r.preco_antigo),
            newPrice: parseFloat(r.preco_novo),
            changedAt: r.alterado_em
        })));
    }
    catch (err) {
        console.error('Erro ao obter Price History:', err);
        res.status(500).json({ error: 'Erro interno ao obter Price History' });
    }
};
exports.getPriceHistory = getPriceHistory;
// 3. Relatórios de Estoque e Inventário
// 3.1 Nível de Estoque Atual por Variação
const getStockLevels = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT id_variacao_produto, quantidade
       FROM estoque_variacao;`);
        res.json(rows.map(r => ({
            variationId: r.id_variacao_produto,
            stock: parseInt(r.quantidade, 10)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Stock Levels:', err);
        res.status(500).json({ error: 'Erro interno ao obter Stock Levels' });
    }
};
exports.getStockLevels = getStockLevels;
// 3.2 Itens em Alerta Crítico
const getCriticalStockItems = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT id_variacao_produto, quantidade, minimo_critico
       FROM estoque_variacao
       WHERE quantidade <= minimo_critico;`);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Critical Stock Items:', err);
        res.status(500).json({ error: 'Erro interno ao obter Critical Stock Items' });
    }
};
exports.getCriticalStockItems = getCriticalStockItems;
// 3.3 Lead Time de Reposição
const getReorderLeadTimes = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT id_variacao_produto, lead_time_dias
       FROM estoque_variacao;`);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Reorder Lead Times:', err);
        res.status(500).json({ error: 'Erro interno ao obter Reorder Lead Times' });
    }
};
exports.getReorderLeadTimes = getReorderLeadTimes;
// 3.4 Rotatividade de Estoque (último mês)
const getStockTurnover = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`WITH sales AS (
         SELECT SUM(i.quantidade)::numeric AS sold
         FROM itens_pedido i
         JOIN pedidos ped ON ped.id = i.id_pedido
         WHERE ped.criado_em >= now() - INTERVAL '1 month'
       ), avg_stock AS (
         SELECT AVG(quantidade)::numeric AS avg_stock
         FROM estoque_variacao
       )
       SELECT (sold / NULLIF(avg_stock,0)) AS turnover_rate
       FROM sales, avg_stock;`);
        res.json({ turnoverRate: parseFloat(rows[0].turnover_rate) });
    }
    catch (err) {
        console.error('Erro ao obter Stock Turnover:', err);
        res.status(500).json({ error: 'Erro interno ao obter Stock Turnover' });
    }
};
exports.getStockTurnover = getStockTurnover;
// 4. Relatórios de Promoções e Descontos
// 4.1 Uso de Promoções
const getPromotionUsage = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT pp.id_promocao,
              COUNT(DISTINCT ped.id)::bigint AS usage_count
       FROM promocao_produtos pp
       JOIN itens_pedido i ON i.id_produto = pp.id_produto
       JOIN pedidos ped ON ped.id = i.id_pedido
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY pp.id_promocao
       ORDER BY usage_count DESC;`, [start, end]);
        res.json(rows.map(r => ({
            promocaoId: parseInt(r.id_promocao, 10),
            usageCount: parseInt(r.usage_count, 10)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Promotion Usage:', err);
        res.status(500).json({ error: 'Erro interno ao obter Promotion Usage' });
    }
};
exports.getPromotionUsage = getPromotionUsage;
// 4.2 Impacto no Ticket Médio (com vs sem promoção)
const getPromotionTicketImpact = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT
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
       WHERE ped.criado_em BETWEEN $1 AND $2;`, [start, end]);
        const r = rows[0];
        res.json({
            withPromotion: parseFloat(r.avg_with_promo),
            withoutPromotion: parseFloat(r.avg_without_promo)
        });
    }
    catch (err) {
        console.error('Erro ao obter Promotion Ticket Impact:', err);
        res.status(500).json({ error: 'Erro interno ao obter Promotion Ticket Impact' });
    }
};
exports.getPromotionTicketImpact = getPromotionTicketImpact;
// 4.3 Vendas Incrementais por Promoção (stub)
const getPromotionIncrementalSales = async (_req, res) => {
    res.status(501).json({ error: 'Not implemented: Promotion Incremental Sales' });
};
exports.getPromotionIncrementalSales = getPromotionIncrementalSales;
// 5. Relatórios de Clientes e Engajamento
// 5.1 Novos vs Clientes Ativos
const getCustomerAcquisition = async (req, res) => {
    try {
        const { start, end } = req.query;
        const [{ rows: newRows }, { rows: activeRows }] = await Promise.all([
            connection_1.pool.query(`SELECT COUNT(*)::int AS new_customers
         FROM clientes
         WHERE criado_em BETWEEN $1 AND $2;`, [start, end]),
            connection_1.pool.query(`SELECT COUNT(DISTINCT id_cliente)::int AS active_customers
         FROM pedidos
         WHERE criado_em BETWEEN $1 AND $2;`, [start, end])
        ]);
        res.json({
            newCustomers: newRows[0].new_customers,
            activeCustomers: activeRows[0].active_customers
        });
    }
    catch (err) {
        console.error('Erro ao obter Customer Acquisition:', err);
        res.status(500).json({ error: 'Erro interno ao obter Customer Acquisition' });
    }
};
exports.getCustomerAcquisition = getCustomerAcquisition;
// 5.2 Top Clientes por Receita
const getTopCustomers = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT ped.id_cliente,
              SUM(ped.valor_total)::numeric AS total_spent
       FROM pedidos ped
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY ped.id_cliente
       ORDER BY total_spent DESC
       LIMIT 10;`, [start, end]);
        res.json(rows.map(r => ({
            clienteId: parseInt(r.id_cliente, 10),
            spent: parseFloat(r.total_spent)
        })));
    }
    catch (err) {
        console.error('Erro ao obter Top Customers:', err);
        res.status(500).json({ error: 'Erro interno ao obter Top Customers' });
    }
};
exports.getTopCustomers = getTopCustomers;
// 5.3 Distribuição Geográfica
const getGeoDistribution = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT e.cidade,
              COUNT(*)::int AS orders_count
       FROM pedidos ped
       JOIN enderecos_cliente e ON e.id = ped.id_endereco_entrega
       WHERE ped.criado_em BETWEEN $1 AND $2
       GROUP BY e.cidade
       ORDER BY orders_count DESC;`, [start, end]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Geo Distribution:', err);
        res.status(500).json({ error: 'Erro interno ao obter Geo Distribution' });
    }
};
exports.getGeoDistribution = getGeoDistribution;
// 5.4 Produtos Favoritados
const getFavoritedProducts = async (req, res) => {
    try {
        const { start, end } = req.query;
        const { rows } = await connection_1.pool.query(`SELECT id_produto,
              COUNT(*)::int AS favorites_count
       FROM favoritos
       WHERE criado_em BETWEEN $1 AND $2
       GROUP BY id_produto
       ORDER BY favorites_count DESC;`, [start, end]);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Favorited Products:', err);
        res.status(500).json({ error: 'Erro interno ao obter Favorited Products' });
    }
};
exports.getFavoritedProducts = getFavoritedProducts;
// 5.5 Abandono de Carrinho
const getCartAbandonment = async (_req, res) => {
    res.status(501).json({ error: 'Not implemented: Cart Abandonment' });
};
exports.getCartAbandonment = getCartAbandonment;
// 6. Relatórios de Atendimento e Feedback
// 6.1 Avaliações de Loja e Produto
const getRatingsSummary = async (_req, res) => {
    try {
        const [{ rows: lojaRows }, { rows: prodRows }] = await Promise.all([
            connection_1.pool.query(`SELECT 
           AVG(nota)::numeric AS avg_loja,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_loja
         FROM avaliacoes_loja;`),
            connection_1.pool.query(`SELECT 
           AVG(nota)::numeric AS avg_produto,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_produto
         FROM avaliacoes_produto;`)
        ]);
        res.json({
            loja: lojaRows[0],
            produto: prodRows[0]
        });
    }
    catch (err) {
        console.error('Erro ao obter Ratings Summary:', err);
        res.status(500).json({ error: 'Erro interno ao obter Ratings Summary' });
    }
};
exports.getRatingsSummary = getRatingsSummary;
// 6.2 Tempo de Resposta a Avaliações
const getRatingResponseTime = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT 
         AVG(EXTRACT(EPOCH FROM (resposta_loja_ts - criado_em)))::numeric AS avg_response_secs
       FROM (
         SELECT 
           criado_em, 
           CAST(resposta_loja AS timestamp) AS resposta_loja_ts
         FROM avaliacoes_loja
         WHERE resposta_loja IS NOT NULL
       ) sub;`);
        res.json({ avgResponseSecs: parseFloat(rows[0].avg_response_secs) });
    }
    catch (err) {
        console.error('Erro ao obter Rating Response Time:', err);
        res.status(500).json({ error: 'Erro interno ao obter Rating Response Time' });
    }
};
exports.getRatingResponseTime = getRatingResponseTime;
// 6.3 Chamados de Suporte
const getSupportTicketsVolume = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT status,
              COUNT(*)::int AS count
       FROM chamados
       GROUP BY status;`);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Support Tickets Volume:', err);
        res.status(500).json({ error: 'Erro interno ao obter Support Tickets Volume' });
    }
};
exports.getSupportTicketsVolume = getSupportTicketsVolume;
// 6.4 Tempo Médio de Resolução de Chamados
const getTicketResolutionTime = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT 
         AVG(EXTRACT(EPOCH FROM (atualizado_em - criado_em)))::numeric AS avg_resolution_secs
       FROM chamados
       WHERE status <> 'aberto';`);
        res.json({ avgResolutionSecs: parseFloat(rows[0].avg_resolution_secs) });
    }
    catch (err) {
        console.error('Erro ao obter Ticket Resolution Time:', err);
        res.status(500).json({ error: 'Erro interno ao obter Ticket Resolution Time' });
    }
};
exports.getTicketResolutionTime = getTicketResolutionTime;
// 6.5 Notificações Enviadas vs. Lidas
const getNotificationsStats = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT 
         COUNT(*) FILTER (WHERE lida = false)::int AS unread,
         COUNT(*) FILTER (WHERE lida = true)::int  AS read
       FROM notificacoes;`);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Erro ao obter Notifications Stats:', err);
        res.status(500).json({ error: 'Erro interno ao obter Notifications Stats' });
    }
};
exports.getNotificationsStats = getNotificationsStats;
// 7. Relatórios de Pagamentos e Conversão
// 7.1 Métodos de Pagamento Mais Usados
const getPaymentMethodsUsage = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT metodo_pagamento,
              COUNT(*)::int AS count
       FROM pagamentos
       GROUP BY metodo_pagamento
       ORDER BY count DESC;`);
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao obter Payment Methods Usage:', err);
        res.status(500).json({ error: 'Erro interno ao obter Payment Methods Usage' });
    }
};
exports.getPaymentMethodsUsage = getPaymentMethodsUsage;
// 7.2 Taxa de Conversão de Pagamento
const getPaymentConversionRate = async (req, res) => {
    try {
        const { start, end } = req.query;
        const [{ rows: orderRows }, { rows: paymentRows }] = await Promise.all([
            connection_1.pool.query(`SELECT COUNT(*)::int AS total_orders
         FROM pedidos
         WHERE criado_em BETWEEN $1 AND $2;`, [start, end]),
            connection_1.pool.query(`SELECT COUNT(*)::int AS paid_payments
         FROM pagamentos pg
         JOIN pedidos ped ON ped.id = pg.id_pedido
         WHERE pg.status_pagamento = 'paid'
           AND ped.criado_em     BETWEEN $1 AND $2;`, [start, end])
        ]);
        const totalOrders = orderRows[0].total_orders;
        const paid = paymentRows[0].paid_payments;
        res.json({
            totalOrders,
            paid,
            conversionRate: totalOrders > 0 ? paid / totalOrders : 0
        });
    }
    catch (err) {
        console.error('Erro ao obter Payment Conversion Rate:', err);
        res.status(500).json({ error: 'Erro interno ao obter Payment Conversion Rate' });
    }
};
exports.getPaymentConversionRate = getPaymentConversionRate;
// 7.3 Estatísticas de QR Code / URL de Pagamento
const getQRCodeStats = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query(`SELECT 
         COUNT(*) FILTER (WHERE qr_code IS NOT NULL)::int    AS qr_count,
         COUNT(*) FILTER (WHERE url_pagamento IS NOT NULL)::int AS url_count
       FROM pagamentos;`);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Erro ao obter QRCode Stats:', err);
        res.status(500).json({ error: 'Erro interno ao obter QRCode Stats' });
    }
};
exports.getQRCodeStats = getQRCodeStats;
