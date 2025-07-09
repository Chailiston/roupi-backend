import { Router } from 'express';
import { getVariacoes, createVariacao } from '../controllers/variacaoProdutoController';

const router = Router();

router.get('/', getVariacoes);
router.post('/', createVariacao);

export default router;
