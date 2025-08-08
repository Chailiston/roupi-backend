"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente/authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/change-password', authController_1.changePassword);
// **adicionar estas linhas:**
router.get('/profile/:id', authController_1.getProfile);
router.put('/profile/:id', authController_1.updateProfile);
exports.default = router;
