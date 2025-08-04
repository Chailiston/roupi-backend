// src/routes/produtoImagemRoutes.ts
import { Router } from 'express';
import {
  getImagensByProduto,
  addImagemProduto,
  deleteImagemProduto,
  setCoverImage
} from '../controllers/produtoImagemController';

const router = Router({ mergeParams: true });

// Imagens de produto (máx 10)
router.get('/:produtoId/imagens',   getImagensByProduto);
router.post('/:produtoId/imagens',  addImagemProduto);
router.delete('/:produtoId/imagens/:imagemId', deleteImagemProduto);
router.put('/:produtoId/imagens/:imagemId/capa', setCoverImage);

export default router;
