// src/routes/lojaRoutes.ts
import { Router } from 'express';
import {
  getLojas,
  createLoja,
  updateLoja,
  getDadosBancarios
} from '../controllers/lojaController';

const router = Router();

router.get('/', getLojas);
router.post('/', createLoja);
router.put('/:id', updateLoja);
router.get('/:id/dados-bancarios', getDadosBancarios);

export default router;

import { getPainelLoja } from '../controllers/lojaController';

router.get('/:id/painel', getPainelLoja);
