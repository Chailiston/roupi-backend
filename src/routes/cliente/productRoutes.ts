import { Router } from 'express'
import {
  getProductDetails,
  searchProducts,
  getRelatedProducts,
} from '../../controllers/cliente/productController' // Verifique se o nome do ficheiro está correto

const router = Router()

// Rota para a pesquisa de produtos (geralmente a mais genérica)
router.get('/', searchProducts)

// ✅ CORREÇÃO: Rota mais específica primeiro
router.get('/:id/related', getRelatedProducts)

// Rota mais genérica depois
router.get('/:id', getProductDetails)

export default router