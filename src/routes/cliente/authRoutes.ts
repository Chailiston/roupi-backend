// backend/src/routes/cliente/authRoutes.ts
import { Router } from 'express';
import { register, login, googleLogin, forgotPassword, resetPassword } from '../../controllers/cliente/authController';
// ✅ 1. IMPORTA O MIDDLEWARE CORRIGIDO
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Rota para registrar um novo cliente
router.post('/auth/register', register);

// Rota para fazer login
router.post('/auth/login', login);

// Rota para fazer login com uma conta do Google
router.post('/auth/google', googleLogin);

// Rota para solicitar redefinição de senha
router.post('/auth/forgot-password', forgotPassword);

// Rota para definir a nova senha (requer autenticação)
// ✅ 2. APLICA O MIDDLEWARE NA ROTA
// Agora, qualquer requisição para esta rota passará primeiro pela verificação do token.
router.post('/auth/reset-password', authMiddleware, resetPassword);

export default router;
