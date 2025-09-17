"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../../controllers/cliente/searchController");
const router = (0, express_1.Router)();
// Rota para a pesquisa de produtos
// Ex: GET /api/cliente/search/products?q=camiseta&categoria=masculino
router.get('/products', searchController_1.searchProducts);
// Rota para a pesquisa de lojas
// Ex: GET /api/cliente/search/stores?q=fashion&lat=-25.43&lng=-49.27
router.get('/stores', searchController_1.searchStores);
exports.default = router;
