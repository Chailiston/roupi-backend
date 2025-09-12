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

// As rotas estão corretas, apenas organizadas.
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.post('/auth/forgot-password', forgotPassword);

// A rota de redefinir senha continua protegida pelo middleware.
router.post('/auth/reset-password', authMiddleware, resetPassword);

export default router;
