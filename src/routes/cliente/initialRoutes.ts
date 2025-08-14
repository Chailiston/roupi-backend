import { Router } from 'express';

// Importa apenas as funções necessárias para estas rotas
import {
  getInitial,
  listStores,
  storeDetails,
  listPromotions
} from '../../controllers/cliente/initialController';

const router = Router();

// --- Rotas da Home e Lojas ---
router.get('/initial', getInitial);
router.get('/stores', listStores);
router.get('/stores/:id', storeDetails);
router.get('/promocoes', listPromotions);

export default router;
