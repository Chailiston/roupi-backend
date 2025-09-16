import { Router } from 'express';
import { 
    register, 
    login, 
    googleLogin, 
    forgotPassword, 
    resetPassword 
} from '../../controllers/cliente/authController';

const router = Router();

// Rotas públicas
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.post('/auth/forgot-password', forgotPassword);

// CORREÇÃO: Rota de redefinição de senha agora é pública,
// pois a autenticação é feita pela própria senha temporária.
router.post('/auth/reset-password', resetPassword);

export default router;

