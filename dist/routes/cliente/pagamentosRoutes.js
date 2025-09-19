"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// ✅ CORREÇÃO: O caminho foi ajustado para sair duas vezes ('../../')
// e então entrar em 'controllers/cliente'.
const pagamentosController_1 = require("../../controllers/cliente/pagamentosController");
// TODO: Importar e aplicar o middleware de autenticação do cliente.
// import { authClienteMiddleware } from '../../middlewares/authCliente';
const router = (0, express_1.Router)();
// =====================================================================
// ROTA PARA CRIAR A PREFERÊNCIA DE PAGAMENTO - PRIVADA
// =====================================================================
// O app do cliente chama esta rota para obter o link de pagamento do MP.
// Deve ser protegida por um middleware que verifique se o cliente está logado.
// =====================================================================
router.post('/preferencia', /* authClienteMiddleware, */ pagamentosController_1.createPaymentPreference);
// =====================================================================
// ROTA DE WEBHOOK - PÚBLICA
// =====================================================================
// Esta rota não deve ter middleware de autenticação, pois é o Mercado Pago
// que vai chamá-la. A segurança é feita pela validação da notificação.
// =====================================================================
router.post('/webhook', pagamentosController_1.handleWebhook);
exports.default = router;
