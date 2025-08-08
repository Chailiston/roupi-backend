// src/routes/cliente/authRoutes.ts
import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  changePassword,
  getProfile,
  updateProfile
} from '../../controllers/cliente/authController';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', changePassword);

// **adicionar estas linhas:**
router.get('/profile/:id',   getProfile);
router.put('/profile/:id',   updateProfile);

export default router;
