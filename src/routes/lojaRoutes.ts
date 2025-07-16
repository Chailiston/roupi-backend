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
} from '../controllers/lojaController';

const router = Router();

// Listar todas as lojas
router.get('/', getLojas);

// Buscar loja por ID
router.get('/:id', getLojaById);

// Criar loja
router.post('/', createLoja);

// Atualizar loja (dados, bancários + logo_url)
router.put('/:id', updateLoja);

// Upload de logo
router.post('/:id/logo', uploadLogo);

// Dados bancários
router.get('/:id/dados-bancarios', getDadosBancarios);

// Painel da loja
router.get('/:id/painel', getPainelLoja);

// Configurações de pagamento
router.get('/:id/payment-settings', getPaymentSettings);
router.put('/:id/payment-settings', updatePaymentSettings);

// Notificação de novo pedido
router.post('/:id/notify-order', notifyNewOrder);

export default router;
