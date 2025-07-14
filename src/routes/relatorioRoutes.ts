import { Router } from 'express';
import {
  getKpis,
  getSalesByDay,
  getTopProducts
} from '../controllers/relatorioController';

const router = Router();

router.get('/kpis', getKpis);
router.get('/vendas-por-dia', getSalesByDay);
router.get('/produtos-mais-vendidos', getTopProducts);

export default router;