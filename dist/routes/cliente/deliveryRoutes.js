"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/deliveryRoutes.ts
const express_1 = require("express");
const deliveryController_1 = require("../../controllers/cliente/deliveryController");
const router = (0, express_1.Router)();
// Rota para calcular as opções de entrega para os itens do carrinho
// Usamos POST porque o corpo da requisição enviará os dados do carrinho
router.post('/calculate', deliveryController_1.calculateDelivery);
exports.default = router;
