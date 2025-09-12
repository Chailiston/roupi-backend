"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addressController_1 = require("../../controllers/cliente/addressController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas as rotas de endereço de cliente requerem autenticação
router.use(authMiddleware_1.authMiddleware);
// Rota para listar todos os endereços ATIVOS do cliente
// GET /api/cliente/enderecos
router.get('/', addressController_1.getAddresses);
// Rota para criar um novo endereço para o cliente
// POST /api/cliente/enderecos
router.post('/', addressController_1.addAddress);
// Rota para atualizar um endereço existente
// PUT /api/cliente/enderecos/:id
router.put('/:id', addressController_1.updateAddress);
// Rota para definir um endereço específico como padrão
// PATCH /api/cliente/enderecos/:id/set-default
router.patch('/:id/set-default', addressController_1.setDefaultAddress);
// Rota para "apagar" (desativar) um endereço
// DELETE /api/cliente/enderecos/:id
router.delete('/:id', addressController_1.deleteAddress);
exports.default = router;
