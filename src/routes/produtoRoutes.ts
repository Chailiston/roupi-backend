// src/routes/produtoRoutes.ts
import { Router } from 'express';
import {
  getProdutosByLoja,
  getProdutoById,
  createProduto,
  updateProduto
} from '../controllers/produtoController';

const router = Router({ mergeParams: true });

// Produtos: CRUD
router.get('/', getProdutosByLoja);
router.get('/:produtoId', getProdutoById);
router.post('/', createProduto);
router.put('/:produtoId', updateProduto);

export default router;
