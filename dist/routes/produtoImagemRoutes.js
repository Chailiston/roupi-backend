"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/produtoImagemRoutes.ts
const express_1 = require("express");
const produtoImagemController_1 = require("../controllers/produtoImagemController");
const router = (0, express_1.Router)({ mergeParams: true });
// Imagens de produto (máx 10)
router.get('/:produtoId/imagens', produtoImagemController_1.getImagensByProduto);
router.post('/:produtoId/imagens', produtoImagemController_1.addImagemProduto);
router.delete('/:produtoId/imagens/:imagemId', produtoImagemController_1.deleteImagemProduto);
router.put('/:produtoId/imagens/:imagemId/capa', produtoImagemController_1.setCoverImage);
exports.default = router;
