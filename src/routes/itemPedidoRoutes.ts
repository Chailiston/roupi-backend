import { Router } from 'express';
import {
  getItensPedido,
  getItensPorPedido,
  createItemPedido,
  updateItemPedido,
  deleteItemPedido
} from '../controllers/itemPedidoController';

const router = Router();

router.get('/itens-pedido', getItensPedido);
router.get('/pedidos/:id/itens', getItensPorPedido);
router.post('/itens-pedido', createItemPedido);
router.put('/itens-pedido/:id', updateItemPedido);
router.delete('/itens-pedido/:id', deleteItemPedido);

export default router;
