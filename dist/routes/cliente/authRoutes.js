"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/cliente/authController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// As rotas estão corretas, apenas organizadas.
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.post('/auth/google', authController_1.googleLogin);
router.post('/auth/forgot-password', authController_1.forgotPassword);
// A rota de redefinir senha continua protegida pelo middleware.
router.post('/auth/reset-password', authMiddleware_1.authMiddleware, authController_1.resetPassword);
exports.default = router;
