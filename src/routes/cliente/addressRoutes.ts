// backend/src/routes/cliente/addressRoutes.ts
import { Router } from 'express';
import { 
    listAddresses, 
    createAddress, 
    setDefaultAddress 
} from '../../controllers/cliente/addressController'; // Você precisará criar este controller
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de endereço devem ser protegidas,
// pois lidam com dados específicos de um usuário logado.
router.use(authMiddleware);

// Rota para listar todos os endereços do cliente logado
// Corresponde a: GET /api/cliente/enderecos
router.get('/', listAddresses);

// Rota para criar um novo endereço para o cliente logado
// Corresponde a: POST /api/cliente/enderecos
router.post('/', createAddress);

// Rota para definir um endereço específico como padrão
// Corresponde a: PATCH /api/cliente/enderecos/:id/set-default
router.patch('/:id/set-default', setDefaultAddress);

export default router;
