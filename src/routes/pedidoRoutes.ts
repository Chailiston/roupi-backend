// src/routes/pedidoRoutes.ts

import { Router } from 'express';
import {
  getPedidoById,
  updatePedidoStatus
} from '../controllers/pedidoController';

const router = Router({ mergeParams: true });

// monta GET /api/lojas/:lojaId/pedidos/:pedidoId
router.get('/:pedidoId', getPedidoById);

// monta PUT /api/lojas/:lojaId/pedidos/:pedidoId/status
router.put('/:pedidoId/status', updatePedidoStatus);

export default router;
