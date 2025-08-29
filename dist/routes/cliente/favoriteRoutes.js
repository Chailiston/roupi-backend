"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const favoriteController_1 = require("../../controllers/cliente/favoriteController");
const router = (0, express_1.Router)();
// Todas as rotas de favoritos são protegidas e exigem autenticação
router.use(authMiddleware_1.authMiddleware);
// Rota para listar os favoritos do usuário
router.get('/', favoriteController_1.listFavorites);
// Rota para adicionar um novo favorito
router.post('/', favoriteController_1.addFavorite);
// Rota para remover um favorito
router.delete('/:productId', favoriteController_1.removeFavorite);
// Rota para checar se um produto específico está favoritado
router.get('/status/:productId', favoriteController_1.checkFavoriteStatus);
exports.default = router;
