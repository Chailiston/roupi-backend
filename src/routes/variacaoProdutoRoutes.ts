import { Router } from 'express';
import {
  getVariacoesByProduto,
  createVariacao,
  updateVariacao,
  deleteVariacao
} from '../controllers/variacaoProdutoController';

const router = Router({ mergeParams: true });

// Listar variações de um produto
router.get('/', getVariacoesByProduto);

// Criar nova variação
router.post('/', createVariacao);

// Atualizar uma variação existente
router.put('/:id', updateVariacao);

// Excluir variação
router.delete('/:id', deleteVariacao);

export default router;
