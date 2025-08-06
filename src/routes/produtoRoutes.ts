// src/routes/produtoRoutes.ts
import { Router } from 'express';
import {
  getProdutosByLoja,
  getProdutoById,
  createProduto,
  updateProduto
} from '../controllers/produtoController';

 import produtoImagemRoutes from './produtoImagemRoutes';

const router = Router({ mergeParams: true });

// Produtos CRUD
router.get('/', getProdutosByLoja);
router.get('/:produtoId', getProdutoById);
router.post('/', createProduto);
router.put('/:produtoId', updateProduto);

 // Sub-rotas de imagens (até 10)
 router.use('/:produtoId/imagens', produtoImagemRoutes);

export default router;
