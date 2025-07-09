import { Router } from 'express';
import {
  getAvaliacoesPorLoja,
  createAvaliacaoLoja,
} from '../controllers/avaliacaoLojaController';

const router = Router();

router.get('/lojas/:loja_id/avaliacoes', getAvaliacoesPorLoja);
router.post('/avaliacoes-loja', createAvaliacaoLoja);

export default router;
