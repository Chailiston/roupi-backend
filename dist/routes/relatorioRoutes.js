"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/relatorioRoutes.ts
const express_1 = require("express");
const relatorioController_1 = require("../controllers/relatorioController");
const router = (0, express_1.Router)();
// KPIs gerais
router.get('/kpis', relatorioController_1.getKpis);
// Vendas agregadas por dia no período
router.get('/vendas-por-dia', relatorioController_1.getSalesByDay);
// Top 10 produtos mais vendidos no período
router.get('/produtos-mais-vendidos', relatorioController_1.getTopProducts);
exports.default = router;
