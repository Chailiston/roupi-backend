import { Router } from 'express';
import {
  getImagensByProduto,
  addImagemProduto,
  deleteImagem
} from '../controllers/produtoImagemController';

const router = Router({ mergeParams: true });

router.get('/', getImagensByProduto);
router.post('/', addImagemProduto);
router.delete('/:imgId', deleteImagem);

export default router;
