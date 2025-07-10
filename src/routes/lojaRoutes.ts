// src/routes/lojaRoutes.ts
import { Router } from 'express';
import {
  getLojas,
  getLojaById,
  createLoja,
  updateLoja,
  getDadosBancarios,
  getPainelLoja
} from '../controllers/lojaController';

const router = Router();

// Listar todas as lojas
router.get('/', getLojas);

// Buscar loja por ID
router.get('/:id', getLojaById);

// Criar loja
router.post('/', createLoja);

// Atualizar loja (Onboarding + dados bancários)
router.put('/:id', updateLoja);

// Dados bancários da loja
router.get('/:id/dados-bancarios', getDadosBancarios);

// Painel da loja
router.get('/:id/painel', getPainelLoja);

export default router;
