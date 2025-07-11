// src/routes/pedidoRoutes.ts
import { Router } from 'express';
import { getPedidoById } from '../controllers/pedidoController';

const router = Router({ mergeParams: true });

// Como o router já está “montado” em /api/lojas/:lojaId/pedidos,
// aqui só precisamos da parte dinâmica após isso:
router.get('/:pedidoId', getPedidoById);

export default router;
