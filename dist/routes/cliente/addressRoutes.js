"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/cliente/addressRoutes.ts
const express_1 = require("express");
const addressController_1 = require("../../controllers/cliente/addressController"); // Você precisará criar este controller
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas as rotas de endereço devem ser protegidas,
// pois lidam com dados específicos de um usuário logado.
router.use(authMiddleware_1.authMiddleware);
// Rota para listar todos os endereços do cliente logado
// Corresponde a: GET /api/cliente/enderecos
router.get('/', addressController_1.listAddresses);
// Rota para criar um novo endereço para o cliente logado
// Corresponde a: POST /api/cliente/enderecos
router.post('/', addressController_1.createAddress);
// Rota para definir um endereço específico como padrão
// Corresponde a: PATCH /api/cliente/enderecos/:id/set-default
router.patch('/:id/set-default', addressController_1.setDefaultAddress);
exports.default = router;
