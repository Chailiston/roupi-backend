// src/routes/cliente/checkoutRoutes.ts
import { Router } from 'express';
// ✅ 1. IMPORTAR OS MÉTODOS ATUALIZADOS DO CONTROLLER
import { 
    getCheckoutDetails, 
    createPaymentPreference 
} from '../../controllers/cliente/checkoutController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// =====================================================================
// ROTAS DE CHECKOUT - PROTEGIDAS POR AUTENTICAÇÃO
// =====================================================================

// Aplica o middleware de autenticação a todas as rotas deste ficheiro
router.use(authMiddleware);

// Rota para buscar os dados iniciais para a tela de checkout (endereços, etc.)
router.get('/details', getCheckoutDetails);

// ✅ 2. NOVA ROTA PARA CRIAR A PREFERÊNCIA DE PAGAMENTO (CHECKOUT PRO)
// Esta é a rota que o seu app vai chamar para obter o link de pagamento do Mercado Pago.
router.post('/create-preference', createPaymentPreference);


// =====================================================================
// 🚨 ROTA ANTIGA (PAYMENT BRICK) - AGORA DESCONTINUADA
// =====================================================================
// A rota antiga '/orders' foi removida para evitar o seu uso.
// Ela foi substituída pela rota '/create-preference' acima.
// router.post('/orders', placeOrder);

export default router;

