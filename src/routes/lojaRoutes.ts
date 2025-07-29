// src/routes/lojaRoutes.ts
import { Router } from 'express';
import {
  getLojas,
  getLojaById,
  createLoja,
  updateLoja,
  uploadLogo,
  getDadosBancarios,
  getPainelLoja,
  getPaymentSettings,
  updatePaymentSettings,
  notifyNewOrder
} from '../controllers/lojaController';  // <-- plural, deve bater com o nome do arquivo

const router = Router();

// Listar todas as lojas
router.get('/', getLojas);

// Buscar loja por ID (já traz também dados bancários via LEFT JOIN)
router.get('/:id', getLojaById);

// Criar loja
router.post('/', createLoja);

// Atualizar loja (dados básicos + bancários)
router.put('/:id', updateLoja);

// Upload de logo
router.post('/:id/logo', uploadLogo);

// Obter dados bancários (separado, caso precise endpoint dedicado)
router.get('/:id/dados-bancarios', getDadosBancarios);

// Painel da loja (estatísticas, últimos pedidos etc)
router.get('/:id/painel', getPainelLoja);

// Configurações de pagamento
router.get('/:id/payment-settings', getPaymentSettings);
router.put('/:id/payment-settings', updatePaymentSettings);

// Notificação de novo pedido (push)
router.post('/:id/notify-order', notifyNewOrder);

export default router;
