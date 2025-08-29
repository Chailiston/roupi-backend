// src/routes/cliente/profileRoutes.ts
import { Router } from 'express';
import { getProfile, updateProfile, updatePassword } from '../../controllers/cliente/profileController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// =====================================================================
// ROTAS DE PERFIL DO CLIENTE - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================

// Aplica o middleware de autenticação a todas as rotas neste arquivo.
// Isso garante que apenas um cliente logado possa acessar seus dados.
router.use(authMiddleware);

// Rota para buscar os dados do perfil do cliente logado
router.get('/', getProfile);

// Rota para atualizar os dados cadastrais (nome, telefone, cpf)
router.put('/', updateProfile);

// Rota específica e segura para alterar a senha
router.put('/password', updatePassword);

export default router;
