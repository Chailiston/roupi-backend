"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/cliente/authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const router = (0, express_1.Router)();
// Rota para registrar um novo cliente
router.post('/auth/register', authController_1.register);
// Rota para fazer login
router.post('/auth/login', authController_1.login);
// Rota para fazer login com uma conta do Google
router.post('/auth/google', authController_1.googleLogin);
// Rota para solicitar redefinição de senha
router.post('/auth/forgot-password', authController_1.forgotPassword);
// Rota para definir a nova senha (requer autenticação)
// Esta rota precisará de um middleware de autenticação no futuro
router.post('/auth/reset-password', authController_1.resetPassword);
exports.default = router;
