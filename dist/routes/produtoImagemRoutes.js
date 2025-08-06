"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/produtoImagemRoutes.ts
const express_1 = require("express");
const produtoImagemController_1 = require("../controllers/produtoImagemController");
const router = (0, express_1.Router)({ mergeParams: true });
// agora, montado em /api/lojas/:lojaId/produtos/:produtoId/imagens
// GET    /
router.get('/', produtoImagemController_1.getImagensByProduto);
// POST   /
router.post('/', produtoImagemController_1.addImagemProduto);
// DELETE /:imagemId
router.delete('/:imagemId', produtoImagemController_1.deleteImagemProduto);
// PUT    /:imagemId/capa
router.put('/:imagemId/capa', produtoImagemController_1.setCoverImage);
exports.default = router;
