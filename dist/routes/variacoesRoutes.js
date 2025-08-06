"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/variacoesRoutes.ts
const express_1 = require("express");
const variacaoController_1 = require("../controllers/variacaoController");
const router = (0, express_1.Router)({ mergeParams: true });
// GET    /api/lojas/:lojaId/produtos/:produtoId/variacoes
router.get('/', variacaoController_1.getVariacoesByProduto);
// POST   /api/lojas/:lojaId/produtos/:produtoId/variacoes
router.post('/', variacaoController_1.createVariacao);
// PUT    /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
router.put('/:id', variacaoController_1.updateVariacao);
// DELETE /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
router.delete('/:id', variacaoController_1.deleteVariacao);
exports.default = router;
