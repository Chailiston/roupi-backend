// src/routes/clientAuthRoutes.ts
import { Router } from 'express';
import * as Auth from '../controllers/clientAuthController';

const router = Router();

// POST /api/cliente/auth/register
router.post('/register',        Auth.register);
// POST /api/cliente/auth/login
router.post('/login',           Auth.login);
// POST /api/cliente/auth/forgot-password
router.post('/forgot-password', Auth.forgotPassword);
// POST /api/cliente/auth/change-password
router.post('/change-password', Auth.changePassword);

export default router;
