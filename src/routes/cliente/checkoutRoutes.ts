// src/routes/cliente/checkoutRoutes.ts
import { Router } from 'express';
import { getCheckoutDetails, placeOrder } from '../../controllers/cliente/checkoutController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// =====================================================================
// ROTAS DE CHECKOUT E PEDIDOS - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================

// Rota para buscar os dados iniciais para a tela de checkout (endereços, etc.)
// O middleware `authMiddleware` é executado primeiro para garantir que o utilizador está logado.
router.get('/checkout/details', authMiddleware, getCheckoutDetails);

// Rota para criar um novo pedido a partir do carrinho
// Também protegida, pois apenas um utilizador logado pode fazer um pedido.
router.post('/orders', authMiddleware, placeOrder);

export default router;
