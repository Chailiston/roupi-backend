// backend/src/routes/cliente/authRoutes.ts
import { Router } from 'express';
import { register, login, googleLogin, forgotPassword, resetPassword } from '../../controllers/cliente/authController';

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
// Esta rota precisará de um middleware de autenticação no futuro
router.post('/auth/reset-password', resetPassword);

export default router;
