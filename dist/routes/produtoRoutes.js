"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produtoController_1 = require("../controllers/produtoController");
const router = (0, express_1.Router)();
router.get('/', produtoController_1.getProdutos);
router.get('/:id', produtoController_1.getProdutoById);
router.get('/loja/:id', produtoController_1.getProdutosByLoja); // Corrigido para evitar conflito com /:id
router.post('/', produtoController_1.createProduto);
router.put('/:id', produtoController_1.updateProduto);
router.delete('/:id', produtoController_1.deleteProduto);
exports.default = router;
