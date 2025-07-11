import { Router } from 'express';
import {
  getPedidosByLoja,
  getPedidoById,
  updatePedidoStatus
} from '../controllers/pedidoController';

const router = Router({ mergeParams: true });

// 1) Lista todos os pedidos de uma loja
router.get('/', getPedidosByLoja);

// 2) Detalha um pedido
router.get('/:pedidoId', getPedidoById);

// 3) Atualiza o status
router.put('/:pedidoId/status', updatePedidoStatus);

export default router;
