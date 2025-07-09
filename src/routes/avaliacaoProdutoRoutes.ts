import { Router } from 'express';
import {
  getAvaliacoes,
  getAvaliacoesPorProduto,
  createAvaliacao,
  deleteAvaliacao,
} from '../controllers/avaliacaoProdutoController';

const router = Router();

router.get('/avaliacoes', getAvaliacoes);
router.get('/produtos/:id/avaliacoes', getAvaliacoesPorProduto);
router.post('/avaliacoes', createAvaliacao);
router.delete('/avaliacoes/:id', deleteAvaliacao);

export default router;
