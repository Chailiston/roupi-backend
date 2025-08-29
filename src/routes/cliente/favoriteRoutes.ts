import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { listFavorites, addFavorite, removeFavorite, checkFavoriteStatus } from '../../controllers/cliente/favoriteController';

const router = Router();

// Todas as rotas de favoritos são protegidas e exigem autenticação
router.use(authMiddleware);

// Rota para listar os favoritos do usuário
router.get('/', listFavorites);

// Rota para adicionar um novo favorito
router.post('/', addFavorite);

// Rota para remover um favorito
router.delete('/:productId', removeFavorite);

// Rota para checar se um produto específico está favoritado
router.get('/status/:productId', checkFavoriteStatus);

export default router;
