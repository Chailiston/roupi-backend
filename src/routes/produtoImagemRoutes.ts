// src/routes/produtoImagemRoutes.ts
import { Router } from 'express';
import {
  getImagensByProduto,
  addImagemProduto,
  deleteImagemProduto,
  setCoverImage
} from '../controllers/produtoImagemController';

const router = Router({ mergeParams: true });

// agora, montado em /api/lojas/:lojaId/produtos/:produtoId/imagens

// GET    /
router.get('/', getImagensByProduto);

// POST   /
router.post('/', addImagemProduto);

// DELETE /:imagemId
router.delete('/:imagemId', deleteImagemProduto);

// PUT    /:imagemId/capa
router.put('/:imagemId/capa', setCoverImage);

export default router;
