"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importa apenas as funções necessárias para estas rotas
const initialController_1 = require("../../controllers/cliente/initialController");
const router = (0, express_1.Router)();
// --- Rotas da Home e Lojas ---
router.get('/initial', initialController_1.getInitial);
router.get('/stores', initialController_1.listStores);
router.get('/stores/:id', initialController_1.storeDetails);
router.get('/promocoes', initialController_1.listPromotions);
exports.default = router;
