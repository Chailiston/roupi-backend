// src/routes/cliente/deliveryRoutes.ts
import { Router } from 'express';
import { calculateDelivery } from '../../controllers/cliente/deliveryController';

const router = Router();

// Rota para calcular as opções de entrega para os itens do carrinho
// Usamos POST porque o corpo da requisição enviará os dados do carrinho
router.post('/calculate', calculateDelivery);

export default router;
