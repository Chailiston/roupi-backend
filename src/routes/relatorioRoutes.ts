// src/routes/relatorioRoutes.ts
import { Router } from 'express';
import {
  getKpis,
  getSalesByDay,
  getTopProducts
} from '../controllers/relatorioController';

const router = Router();

// KPIs gerais
router.get('/kpis', getKpis);

// Vendas agregadas por dia no período
router.get('/vendas-por-dia', getSalesByDay);

// Top 10 produtos mais vendidos no período
router.get('/produtos-mais-vendidos', getTopProducts);

export default router;
