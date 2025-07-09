import { Router } from 'express';
import {
  vendasPorLoja,
  produtosMaisVendidos,
  faturamentoMensal,
  clientesAtivos
} from '../controllers/relatorioController';

const router = Router();

router.get('/vendas-por-loja', vendasPorLoja);
router.get('/produtos-mais-vendidos', produtosMaisVendidos);
router.get('/faturamento-mensal', faturamentoMensal);
router.get('/clientes-ativos', clientesAtivos);

export default router;
