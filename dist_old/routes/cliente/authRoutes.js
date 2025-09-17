"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const router = (0, express_1.Router)();
// Rotas públicas
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.post('/auth/google', authController_1.googleLogin);
router.post('/auth/forgot-password', authController_1.forgotPassword);
// CORREÇÃO: Rota de redefinição de senha agora é pública,
// pois a autenticação é feita pela própria senha temporária.
router.post('/auth/reset-password', authController_1.resetPassword);
exports.default = router;
