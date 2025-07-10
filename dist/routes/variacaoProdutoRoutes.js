"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const variacaoProdutoController_1 = require("../controllers/variacaoProdutoController");
const router = (0, express_1.Router)();
router.get('/', variacaoProdutoController_1.getVariacoes);
router.post('/', variacaoProdutoController_1.createVariacao);
exports.default = router;
