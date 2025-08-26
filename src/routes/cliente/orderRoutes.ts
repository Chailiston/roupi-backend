// src/routes/cliente/orderRoutes.ts
import { Router } from 'express';
import { listOrders, getOrderDetails } from '../../controllers/cliente/orderController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// =====================================================================
// ROTAS DE PEDIDOS - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================

// Rota para listar todos os pedidos do cliente logado.
// O middleware `authMiddleware` garante que apenas o próprio cliente
// possa ver a sua lista de pedidos.
router.get('/orders', authMiddleware, listOrders);

// Rota para buscar os detalhes de um pedido específico.
// O middleware também protege esta rota, e a lógica no controller
// confirma se o pedido realmente pertence ao cliente que fez a requisição.
router.get('/orders/:id', authMiddleware, getOrderDetails);

export default router;
