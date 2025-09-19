"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagamentosRoutesPublicas = exports.pagamentosRoutesPrivadas = void 0;
const express_1 = require("express");
const pagamentosController_1 = require("../../controllers/cliente/pagamentosController");
// ✅ CORREÇÃO: Alterado para importar 'authMiddleware' do seu arquivo original.
// Garanta que o seu arquivo se chama 'authMiddleware.ts' e está na pasta 'middlewares'.
const authMiddleware_1 = require("../../middlewares/authMiddleware");
// Router para as rotas privadas (exigem autenticação)
// ✅ CORREÇÃO: Exportado diretamente como uma constante nomeada (named export)
exports.pagamentosRoutesPrivadas = (0, express_1.Router)();
exports.pagamentosRoutesPrivadas.post('/preferencia', authMiddleware_1.authMiddleware, pagamentosController_1.createPaymentPreference);
// Router para as rotas públicas (não exigem autenticação)
// ✅ CORREÇÃO: Exportado diretamente como uma constante nomeada (named export)
exports.pagamentosRoutesPublicas = (0, express_1.Router)();
exports.pagamentosRoutesPublicas.post('/webhook', pagamentosController_1.handleWebhook);
