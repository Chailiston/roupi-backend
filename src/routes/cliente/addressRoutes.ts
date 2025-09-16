import { Router } from 'express';
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../../controllers/cliente/addressController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de endereço de cliente requerem autenticação
router.use(authMiddleware);

// Rota para listar todos os endereços ATIVOS do cliente
// GET /api/cliente/enderecos
router.get('/', getAddresses);

// Rota para criar um novo endereço para o cliente
// POST /api/cliente/enderecos
router.post('/', addAddress);

// Rota para atualizar um endereço existente
// PUT /api/cliente/enderecos/:id
router.put('/:id', updateAddress);

// Rota para definir um endereço específico como padrão
// PATCH /api/cliente/enderecos/:id/set-default
router.patch('/:id/set-default', setDefaultAddress);

// Rota para "apagar" (desativar) um endereço
// DELETE /api/cliente/enderecos/:id
router.delete('/:id', deleteAddress);

export default router;
