import { Router } from 'express'
import {
  getProductDetails,
  searchProducts,
  getRelatedProducts, // 1. Importa a nova função
} from '../../controllers/cliente/productController'

const router = Router()

// Rota para a pesquisa de produtos
router.get('/', searchProducts)

// Rota para buscar os detalhes de um único produto
router.get('/:id', getProductDetails)

// 2. Adiciona a nova rota para produtos relacionados
router.get('/:id/related', getRelatedProducts)

export default router
