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
// CORREÇÃO: Removido o prefixo '/auth' daqui, pois ele já está no server.ts
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/google', authController_1.googleLogin);
router.post('/forgot-password', authController_1.forgotPassword);
// --- Rota Protegida (precisa de token) ---
// CORREÇÃO: Removido o prefixo '/auth' daqui
router.post('/reset-password', authMiddleware_1.authMiddleware, authController_1.resetPassword);
exports.default = router;
