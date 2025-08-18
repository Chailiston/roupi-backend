"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../../controllers/cliente/productController");
const router = (0, express_1.Router)();
// Rota para a pesquisa de produtos
router.get('/', productController_1.searchProducts);
// Rota para buscar os detalhes de um único produto
router.get('/:id', productController_1.getProductDetails);
// 2. Adiciona a nova rota para produtos relacionados
router.get('/:id/related', productController_1.getRelatedProducts);
exports.default = router;
