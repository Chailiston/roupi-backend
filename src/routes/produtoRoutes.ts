import { Router } from 'express';
import { getProdutosByLoja, createProduto, updateProduto } from '../controllers/produtoController';

const router = Router({ mergeParams: true });

// Listar produtos da loja
router.get('/', getProdutosByLoja);
// Criar novo produto
router.post('/', createProduto);
// Atualizar produto existente
router.put('/:produtoId', updateProduto);

export default router;