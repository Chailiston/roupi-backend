// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, forgotPassword } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// não existe mais /reset-password

export default router;
