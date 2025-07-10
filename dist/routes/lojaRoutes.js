"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lojaController_1 = require("../controllers/lojaController");
const router = (0, express_1.Router)();
// Listar todas as lojas
router.get('/', lojaController_1.getLojas);
// Buscar loja por ID → **esse agora funciona**
router.get('/:id', lojaController_1.getLojaById);
// Criar loja
router.post('/', lojaController_1.createLoja);
// Atualizar loja
router.put('/:id', lojaController_1.updateLoja);
// Dados bancários da loja
router.get('/:id/dados-bancarios', lojaController_1.getDadosBancarios);
// Painel da loja
router.get('/:id/painel', lojaController_1.getPainelLoja);
exports.default = router;
