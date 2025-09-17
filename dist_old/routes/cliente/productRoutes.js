"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../../controllers/cliente/productController"); // Verifique se o nome do ficheiro está correto
const router = (0, express_1.Router)();
// Rota para a pesquisa de produtos (geralmente a mais genérica)
router.get('/', productController_1.searchProducts);
// ✅ CORREÇÃO: Rota mais específica primeiro
router.get('/:id/related', productController_1.getRelatedProducts);
// Rota mais genérica depois
router.get('/:id', productController_1.getProductDetails);
exports.default = router;
