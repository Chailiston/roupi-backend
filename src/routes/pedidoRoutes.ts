import { Router } from 'express';
import {
  getPedidos,
  getPedidoById,
  getPedidosPorCliente,
  createPedido,
  updateStatusPedido
} from '../controllers/pedidoController';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/:id', getPedidoById);
router.get('/clientes/:id/pedidos', getPedidosPorCliente);
router.post('/pedidos', createPedido);
router.put('/pedidos/:id', updateStatusPedido);

export default router;
