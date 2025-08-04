// src/routes/clientProfileRoutes.ts
import { Router } from 'express';
import * as P from '../controllers/clientProfileController';

const router = Router();

// Buscar perfil pelo ID do cliente
// GET /api/cliente/profile/:clientId
router.get('/:clientId', P.getProfile);

// Atualizar perfil pelo ID do cliente
// PUT /api/cliente/profile/:clientId
router.put('/:clientId', P.updateProfile);

export default router;
