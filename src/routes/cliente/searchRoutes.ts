import { Router } from 'express';
import {
  searchProducts,
  searchStores,
} from '../../controllers/cliente/searchController';

const router = Router();

// Rota para a pesquisa de produtos
// Ex: GET /api/cliente/search/products?q=camiseta&categoria=masculino
router.get('/products', searchProducts);

// Rota para a pesquisa de lojas
// Ex: GET /api/cliente/search/stores?q=fashion&lat=-25.43&lng=-49.27
router.get('/stores', searchStores);

export default router;
