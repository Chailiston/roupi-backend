"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE AUTENTICAÇÃO DO CLIENTE
// =====================================================================
// --- Rotas Públicas (não precisam de token) ---
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.post('/auth/google', authController_1.googleLogin);
router.post('/auth/forgot-password', authController_1.forgotPassword);
// --- Rota Protegida (precisa de token) ---
// O usuário DEVE estar logado (com o token da senha temporária) para poder redefinir a senha.
// Por isso, adicionamos o 'authMiddleware' aqui.
router.post('/auth/reset-password', authMiddleware_1.authMiddleware, authController_1.resetPassword);
exports.default = router;
