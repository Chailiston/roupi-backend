import { Router } from 'express';
import { 
    register, 
    login, 
    googleLogin, 
    forgotPassword, 
    resetPassword 
} from '../../controllers/cliente/authController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// =====================================================================
// ROTAS DE AUTENTICAÇÃO DO CLIENTE
// =====================================================================

// --- Rotas Públicas (não precisam de token) ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.post('/auth/forgot-password', forgotPassword);


// --- Rota Protegida (precisa de token) ---

// O usuário DEVE estar logado (com o token da senha temporária) para poder redefinir a senha.
// Por isso, adicionamos o 'authMiddleware' aqui.
router.post('/auth/reset-password', authMiddleware, resetPassword);

export default router;