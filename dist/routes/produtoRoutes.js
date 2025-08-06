"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/produtoRoutes.ts
const express_1 = require("express");
const produtoController_1 = require("../controllers/produtoController");
const router = (0, express_1.Router)({ mergeParams: true });
// Produtos: CRUD
router.get('/', produtoController_1.getProdutosByLoja);
router.get('/:produtoId', produtoController_1.getProdutoById);
router.post('/', produtoController_1.createProduto);
router.put('/:produtoId', produtoController_1.updateProduto);
exports.default = router;
