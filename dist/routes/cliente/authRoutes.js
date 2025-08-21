"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/cliente/authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const router = (0, express_1.Router)();
// Rota para registrar um novo cliente com e-mail e senha
// POST /api/cliente/auth/register
router.post('/auth/register', authController_1.register);
// Rota para fazer login com e-mail e senha
// POST /api/cliente/auth/login
router.post('/auth/login', authController_1.login);
// Rota para fazer login ou registrar com uma conta do Google
// POST /api/cliente/auth/google
router.post('/auth/google', authController_1.googleLogin);
exports.default = router;
