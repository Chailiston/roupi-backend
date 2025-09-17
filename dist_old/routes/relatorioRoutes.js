"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/relatorioRoutes.ts
const express_1 = require("express");
const relatorioController_1 = require("../controllers/relatorioController");
const router = (0, express_1.Router)();
// 1. Vendas e Receita
router.get('/kpis', relatorioController_1.getSalesSummary);
router.get('/ticket-evolucao', relatorioController_1.getTicketEvolution);
router.get('/vendas-por-dia', relatorioController_1.getSalesByDay);
router.get('/produtos-mais-vendidos', relatorioController_1.getTopProducts);
router.get('/vendas-por-categoria', relatorioController_1.getSalesByCategory);
router.get('/vendas-por-loja', relatorioController_1.getSalesByStore);
// 2. Financeiro
router.get('/recebimentos-summary', relatorioController_1.getReceiptsSummary);
router.get('/fluxo-caixa', relatorioController_1.getCashFlowProjection);
router.get('/historico-preco', relatorioController_1.getPriceHistory);
// 3. Estoque e Inventário
router.get('/estoque-niveis', relatorioController_1.getStockLevels);
router.get('/estoque-critico', relatorioController_1.getCriticalStockItems);
router.get('/leadtime-reposicao', relatorioController_1.getReorderLeadTimes);
router.get('/rotatividade-estoque', relatorioController_1.getStockTurnover);
// 4. Promoções e Descontos
router.get('/promocao-uso', relatorioController_1.getPromotionUsage);
router.get('/promocao-ticket-impact', relatorioController_1.getPromotionTicketImpact);
router.get('/promocao-incremental-sales', relatorioController_1.getPromotionIncrementalSales);
// 5. Clientes e Engajamento
router.get('/clientes-aquisicao', relatorioController_1.getCustomerAcquisition);
router.get('/top-clientes', relatorioController_1.getTopCustomers);
router.get('/geo-distribuicao', relatorioController_1.getGeoDistribution);
router.get('/produtos-favoritados', relatorioController_1.getFavoritedProducts);
router.get('/abandono-carrinho', relatorioController_1.getCartAbandonment);
// 6. Atendimento e Feedback
router.get('/avaliacoes-summary', relatorioController_1.getRatingsSummary);
router.get('/avaliacoes-response-time', relatorioController_1.getRatingResponseTime);
router.get('/suporte-chamados-volume', relatorioController_1.getSupportTicketsVolume);
router.get('/chamados-tempo-resolucao', relatorioController_1.getTicketResolutionTime);
router.get('/notificacoes-stats', relatorioController_1.getNotificationsStats);
// 7. Pagamentos e Conversão
router.get('/metodos-pagamento', relatorioController_1.getPaymentMethodsUsage);
router.get('/taxa-conversao-pagamento', relatorioController_1.getPaymentConversionRate);
router.get('/qrcode-stats', relatorioController_1.getQRCodeStats);
exports.default = router;
