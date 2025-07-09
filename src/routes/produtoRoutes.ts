import { Router } from 'express';
import {
  getProdutos,
  getProdutoById,
  getProdutosByLoja,
  createProduto,
  updateProduto,
  deleteProduto
} from '../controllers/produtoController';

const router = Router();

router.get('/', getProdutos);
router.get('/:id', getProdutoById);
router.get('/loja/:id', getProdutosByLoja); // Corrigido para evitar conflito com /:id
router.post('/', createProduto);
router.put('/:id', updateProduto);
router.delete('/:id', deleteProduto);

export default router;
