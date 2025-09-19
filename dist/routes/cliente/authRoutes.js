"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
// O middleware não é necessário neste ficheiro, pois nenhuma destas rotas depende de um login prévio.
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE AUTENTICAÇÃO DO CLIENTE - TODAS PÚBLICAS
// =====================================================================
// Rota para registar um novo utilizador
router.post('/register', authController_1.register);
// Rota para fazer login com e-mail e senha
router.post('/login', authController_1.login);
// Rota para fazer login com uma conta Google
router.post('/google', authController_1.googleLogin);
// Rota para pedir uma senha temporária
router.post('/forgot-password', authController_1.forgotPassword);
// 🚨 ROTA REMOVIDA: A rota '/reset-password' foi descontinuada.
// A alteração de senha agora é feita através da rota PUT /api/cliente/profile/password após o login.
exports.default = router;
