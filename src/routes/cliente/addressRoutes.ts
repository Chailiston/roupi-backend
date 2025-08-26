// backend/src/routes/cliente/addressRoutes.ts
import { Router } from 'express';
import { 
    listAddresses, 
    createAddress, 
    setDefaultAddress,
    deleteAddress // ✅ 1. Importar a nova função
} from '../../controllers/cliente/addressController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de endereço são protegidas, pois lidam
// com dados específicos de um utilizador logado.
router.use(authMiddleware);

// Rota para listar todos os endereços ATIVOS do cliente
// GET /api/cliente/enderecos
router.get('/', listAddresses);

// Rota para criar um novo endereço para o cliente
// POST /api/cliente/enderecos
router.post('/', createAddress);

// Rota para definir um endereço específico como padrão
// PATCH /api/cliente/enderecos/:id/set-default
router.patch('/:id/set-default', setDefaultAddress);

// ✅ 2. Adicionar a nova rota para "apagar" (desativar) um endereço
// DELETE /api/cliente/enderecos/:id
router.delete('/:id', deleteAddress);

export default router;
