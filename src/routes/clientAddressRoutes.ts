// src/routes/enderecoClienteRoutes.ts
import { Router } from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from '../controllers/clientAddressController';

const router = Router({ mergeParams: true });

// /api/clientes/:clientId/enderecos
router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:addressId', updateAddress);
router.delete('/:addressId', deleteAddress);

export default router;
