"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const avaliacaoLojaController_1 = require("../controllers/avaliacaoLojaController");
const router = (0, express_1.Router)();
router.get('/lojas/:loja_id/avaliacoes', avaliacaoLojaController_1.getAvaliacoesPorLoja);
router.post('/avaliacoes-loja', avaliacaoLojaController_1.createAvaliacaoLoja);
exports.default = router;
