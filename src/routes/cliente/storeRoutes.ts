// src/routes/cliente/storeRoutes.ts
import { Router } from 'express';
import { getStoreDetails } from '../../controllers/cliente/storeController';

const router = Router();

// Rota para buscar os detalhes de uma única loja e seus produtos
router.get('/:id', getStoreDetails);

// No futuro, se você precisar de outras rotas relacionadas a lojas,
// como por exemplo, uma rota para buscar apenas as avaliações de uma loja,
// você pode adicioná-la aqui.
// Exemplo: router.get('/:id/avaliacoes', getStoreReviews);

export default router;
