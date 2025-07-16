// src/routes/authRoutes.ts
import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  changePassword
} from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', changePassword);

export default router;
