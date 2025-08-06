"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pedidoController_1 = require("../controllers/pedidoController");
const router = (0, express_1.Router)({ mergeParams: true });
// 1) Lista todos os pedidos de uma loja
router.get('/', pedidoController_1.getPedidosByLoja);
// 2) Detalha um pedido
router.get('/:pedidoId', pedidoController_1.getPedidoById);
// 3) Atualiza o status
router.put('/:pedidoId/status', pedidoController_1.updatePedidoStatus);
exports.default = router;
