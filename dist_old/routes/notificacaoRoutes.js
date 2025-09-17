"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificacaoController_1 = require("../controllers/notificacaoController");
const router = (0, express_1.Router)();
router.get('/notificacoes/:cliente_id', notificacaoController_1.getNotificacoesPorCliente);
router.post('/notificacoes', notificacaoController_1.createNotificacao);
router.put('/notificacoes/:id/lida', notificacaoController_1.marcarComoLida);
exports.default = router;
