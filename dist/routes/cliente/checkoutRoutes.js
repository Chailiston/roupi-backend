"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/checkoutRoutes.ts
const express_1 = require("express");
// ✅ 1. IMPORTAR OS MÉTODOS ATUALIZADOS DO CONTROLLER
const checkoutController_1 = require("../../controllers/cliente/checkoutController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE CHECKOUT - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================
// Aplica o middleware de autenticação a todas as rotas deste ficheiro
router.use(authMiddleware_1.authMiddleware);
// Rota para buscar os dados iniciais para a tela de checkout (endereços, etc.)
router.get('/details', checkoutController_1.getCheckoutDetails);
// ✅ 2. NOVA ROTA PARA CRIAR A PREFERÊNCIA DE PAGAMENTO (CHECKOUT PRO)
// Esta é a rota que o seu app vai chamar para obter o link de pagamento do Mercado Pago.
router.post('/create-preference', checkoutController_1.createPaymentPreference);
// =====================================================================
// 🚨 ROTA ANTIGA (PAYMENT BRICK) - AGORA DESCONTINUADA
// =====================================================================
// A rota antiga '/orders' foi removida para evitar o seu uso.
// Ela foi substituída pela rota '/create-preference' acima.
// router.post('/orders', placeOrder);
exports.default = router;
