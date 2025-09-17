"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/checkoutRoutes.ts
const express_1 = require("express");
const checkoutController_1 = require("../../controllers/cliente/checkoutController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE CHECKOUT E PEDIDOS - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================
// Rota para buscar os dados iniciais para a tela de checkout (endereços, etc.)
// O middleware `authMiddleware` é executado primeiro para garantir que o utilizador está logado.
router.get('/checkout/details', authMiddleware_1.authMiddleware, checkoutController_1.getCheckoutDetails);
// Rota para criar um novo pedido a partir do carrinho
// Também protegida, pois apenas um utilizador logado pode fazer um pedido.
router.post('/orders', authMiddleware_1.authMiddleware, checkoutController_1.placeOrder);
exports.default = router;
