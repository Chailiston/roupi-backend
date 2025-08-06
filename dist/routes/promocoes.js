"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promocaoController_1 = require("../controllers/promocaoController");
const router = (0, express_1.Router)();
// CRUD
router.get('/', promocaoController_1.getPromocoes);
router.get('/:id', promocaoController_1.getPromocaoById);
router.post('/', promocaoController_1.createPromocao);
router.put('/:id', promocaoController_1.updatePromocao);
router.patch('/:id/ativo', promocaoController_1.toggleAtivo);
router.delete('/:id', promocaoController_1.deletePromocao);
exports.default = router;
