"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/storeRoutes.ts
const express_1 = require("express");
const storeController_1 = require("../../controllers/cliente/storeController");
const router = (0, express_1.Router)();
// Rota para buscar os detalhes de uma única loja e seus produtos
router.get('/:id', storeController_1.getStoreDetails);
// No futuro, se você precisar de outras rotas relacionadas a lojas,
// como por exemplo, uma rota para buscar apenas as avaliações de uma loja,
// você pode adicioná-la aqui.
// Exemplo: router.get('/:id/avaliacoes', getStoreReviews);
exports.default = router;
