"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/profileRoutes.ts
const express_1 = require("express");
const profileController_1 = require("../../controllers/cliente/profileController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// =====================================================================
// ROTAS DE PERFIL DO CLIENTE - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================
// Aplica o middleware de autenticação a todas as rotas neste arquivo.
// Isso garante que apenas um cliente logado possa acessar seus dados.
router.use(authMiddleware_1.authMiddleware);
// Rota para buscar os dados do perfil do cliente logado
router.get('/', profileController_1.getProfile);
// Rota para atualizar os dados cadastrais (nome, telefone, cpf)
router.put('/', profileController_1.updateProfile);
// Rota específica e segura para alterar a senha
router.put('/password', profileController_1.updatePassword);
exports.default = router;
