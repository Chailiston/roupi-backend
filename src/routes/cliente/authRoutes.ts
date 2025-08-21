// backend/src/routes/cliente/authRoutes.ts
import { Router } from 'express';
import { register, login, googleLogin } from '../../controllers/cliente/authController';

const router = Router();

// Rota para registrar um novo cliente com e-mail e senha
// POST /api/cliente/auth/register
router.post('/auth/register', register);

// Rota para fazer login com e-mail e senha
// POST /api/cliente/auth/login
router.post('/auth/login', login);

// Rota para fazer login ou registrar com uma conta do Google
// POST /api/cliente/auth/google
router.post('/auth/google', googleLogin);

export default router;
