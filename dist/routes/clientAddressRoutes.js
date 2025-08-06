"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/enderecoClienteRoutes.ts
const express_1 = require("express");
const clientAddressController_1 = require("../controllers/clientAddressController");
const router = (0, express_1.Router)({ mergeParams: true });
// /api/clientes/:clientId/enderecos
router.get('/', clientAddressController_1.getAddresses);
router.post('/', clientAddressController_1.createAddress);
router.put('/:addressId', clientAddressController_1.updateAddress);
router.delete('/:addressId', clientAddressController_1.deleteAddress);
exports.default = router;
