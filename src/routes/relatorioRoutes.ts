// src/routes/relatorioRoutes.ts
import { Router } from 'express';
import {
  getSalesSummary,
  getTicketEvolution,
  getSalesByDay,
  getTopProducts,
  getSalesByCategory,
  getSalesByStore,
  getReceiptsSummary,
  getCashFlowProjection,
  getPriceHistory,
  getStockLevels,
  getCriticalStockItems,
  getReorderLeadTimes,
  getStockTurnover,
  getPromotionUsage,
  getPromotionTicketImpact,
  getPromotionIncrementalSales,
  getCustomerAcquisition,
  getTopCustomers,
  getGeoDistribution,
  getFavoritedProducts,
  getCartAbandonment,
  getRatingsSummary,
  getRatingResponseTime,
  getSupportTicketsVolume,
  getTicketResolutionTime,
  getNotificationsStats,
  getPaymentMethodsUsage,
  getPaymentConversionRate,
  getQRCodeStats
} from '../controllers/relatorioController';

const router = Router();

// 1. Vendas e Receita
router.get('/kpis',                   getSalesSummary);
router.get('/ticket-evolucao',        getTicketEvolution);
router.get('/vendas-por-dia',         getSalesByDay);
router.get('/produtos-mais-vendidos', getTopProducts);
router.get('/vendas-por-categoria',   getSalesByCategory);
router.get('/vendas-por-loja',        getSalesByStore);

// 2. Financeiro
router.get('/recebimentos-summary',   getReceiptsSummary);
router.get('/fluxo-caixa',            getCashFlowProjection);
router.get('/historico-preco',        getPriceHistory);

// 3. Estoque e Inventário
router.get('/estoque-niveis',         getStockLevels);
router.get('/estoque-critico',        getCriticalStockItems);
router.get('/leadtime-reposicao',     getReorderLeadTimes);
router.get('/rotatividade-estoque',   getStockTurnover);

// 4. Promoções e Descontos
router.get('/promocao-uso',                  getPromotionUsage);
router.get('/promocao-ticket-impact',        getPromotionTicketImpact);
router.get('/promocao-incremental-sales',    getPromotionIncrementalSales);

// 5. Clientes e Engajamento
router.get('/clientes-aquisicao',    getCustomerAcquisition);
router.get('/top-clientes',          getTopCustomers);
router.get('/geo-distribuicao',      getGeoDistribution);
router.get('/produtos-favoritados',  getFavoritedProducts);
router.get('/abandono-carrinho',     getCartAbandonment);

// 6. Atendimento e Feedback
router.get('/avaliacoes-summary',         getRatingsSummary);
router.get('/avaliacoes-response-time',   getRatingResponseTime);
router.get('/suporte-chamados-volume',    getSupportTicketsVolume);
router.get('/chamados-tempo-resolucao',   getTicketResolutionTime);
router.get('/notificacoes-stats',         getNotificationsStats);

// 7. Pagamentos e Conversão
router.get('/metodos-pagamento',          getPaymentMethodsUsage);
router.get('/taxa-conversao-pagamento',   getPaymentConversionRate);
router.get('/qrcode-stats',               getQRCodeStats);

export default router;
