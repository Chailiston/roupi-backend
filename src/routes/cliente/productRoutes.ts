import { Router } from 'express'
import {
  getProductDetails,
  searchProducts,
} from '../../controllers/cliente/productController' // Importa do novo controller

const router = Router()

// Rota para a pesquisa de produtos (ex: /api/cliente/produtos?search=...)
router.get('/', searchProducts)

// Rota para buscar os detalhes de um único produto (ex: /api/cliente/produtos/123)
router.get('/:id', getProductDetails)

export default router
