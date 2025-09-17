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
// CORREÇÃO: Removido o prefixo '/auth' daqui, pois ele já está no server.ts
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);


// --- Rota Protegida (precisa de token) ---
// CORREÇÃO: Removido o prefixo '/auth' daqui
router.post('/reset-password', authMiddleware, resetPassword);

export default router;
