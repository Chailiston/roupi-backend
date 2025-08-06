// src/routes/variacoesRoutes.ts
import { Router } from 'express'
import {
  getVariacoesByProduto,
  getVariacaoById,
  createVariacao,
  updateVariacao,
  deleteVariacao
} from '../controllers/variacaoController'

const router = Router({ mergeParams: true })

// GET    /api/lojas/:lojaId/produtos/:produtoId/variacoes
router.get('/', getVariacoesByProduto)

// GET    /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
router.get('/:id', getVariacaoById)

// POST   /api/lojas/:lojaId/produtos/:produtoId/variacoes
router.post('/', createVariacao)

// PUT    /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
router.put('/:id', updateVariacao)

// DELETE /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
router.delete('/:id', deleteVariacao)

export default router
