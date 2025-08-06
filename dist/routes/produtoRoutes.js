"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/produtoRoutes.ts
const express_1 = require("express");
const produtoController_1 = require("../controllers/produtoController");
const produtoImagemRoutes_1 = __importDefault(require("./produtoImagemRoutes"));
const router = (0, express_1.Router)({ mergeParams: true });
// Produtos CRUD
router.get('/', produtoController_1.getProdutosByLoja);
router.get('/:produtoId', produtoController_1.getProdutoById);
router.post('/', produtoController_1.createProduto);
router.put('/:produtoId', produtoController_1.updateProduto);
// Sub-rotas de imagens (até 10)
router.use('/:produtoId/imagens', produtoImagemRoutes_1.default);
exports.default = router;
