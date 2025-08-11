import { Router } from 'express'
import {
  getInitial,
  listStores,
  storeDetails,
  searchProducts,
  listPromotions
} from '../../controllers/cliente/initialController'

const router = Router()
router.get('/initial', getInitial)
router.get('/stores', listStores)
router.get('/stores/:id', storeDetails)
router.get('/produtos', searchProducts)
router.get('/promocoes', listPromotions)

export default router
