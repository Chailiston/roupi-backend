import { Router } from 'express';
import {
    register,
    login,
    googleLogin,
    forgotPassword,
    // A função 'resetPassword' foi removida pois o novo fluxo usa o profileController
} from '../../controllers/cliente/authController';
// O middleware não é necessário neste ficheiro, pois nenhuma destas rotas depende de um login prévio.

const router = Router();

// =====================================================================
// ROTAS DE AUTENTICAÇÃO DO CLIENTE - TODAS PÚBLICAS
// =====================================================================

// Rota para registar um novo utilizador
router.post('/register', register);

// Rota para fazer login com e-mail e senha
router.post('/login', login);

// Rota para fazer login com uma conta Google
router.post('/google', googleLogin);

// Rota para pedir uma senha temporária
router.post('/forgot-password', forgotPassword);

// 🚨 ROTA REMOVIDA: A rota '/reset-password' foi descontinuada.
// A alteração de senha agora é feita através da rota PUT /api/cliente/profile/password após o login.

export default router;
