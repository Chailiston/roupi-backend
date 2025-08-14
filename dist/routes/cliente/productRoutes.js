"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../../controllers/cliente/productController"); // Importa do novo controller
const router = (0, express_1.Router)();
// Rota para a pesquisa de produtos (ex: /api/cliente/produtos?search=...)
router.get('/', productController_1.searchProducts);
// Rota para buscar os detalhes de um único produto (ex: /api/cliente/produtos/123)
router.get('/:id', productController_1.getProductDetails);
exports.default = router;
