"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/orderRoutes.ts
const express_1 = require("express");
const orderController_1 = require("../../controllers/cliente/orderController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE PEDIDOS - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================
// Rota para listar todos os pedidos do cliente logado.
// O middleware `authMiddleware` garante que apenas o próprio cliente
// possa ver a sua lista de pedidos.
router.get('/orders', authMiddleware_1.authMiddleware, orderController_1.listOrders);
// Rota para buscar os detalhes de um pedido específico.
// O middleware também protege esta rota, e a lógica no controller
// confirma se o pedido realmente pertence ao cliente que fez a requisição.
router.get('/orders/:id', authMiddleware_1.authMiddleware, orderController_1.getOrderDetails);
exports.default = router;
