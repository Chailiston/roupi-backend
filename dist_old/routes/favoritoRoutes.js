"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favoritoController_1 = require("../controllers/favoritoController");
const router = (0, express_1.Router)();
router.get('/clientes/:cliente_id/favoritos', favoritoController_1.getFavoritosPorCliente);
router.post('/favoritos', favoritoController_1.addFavorito);
router.delete('/favoritos/:cliente_id/:produto_id', favoritoController_1.removeFavorito);
exports.default = router;
