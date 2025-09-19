import { Router } from 'express';
import { createPaymentPreference, handleWebhook } from '../../controllers/cliente/pagamentosController';
// ✅ CORREÇÃO: Alterado para importar 'authMiddleware' do seu arquivo original.
// Garanta que o seu arquivo se chama 'authMiddleware.ts' e está na pasta 'middlewares'.
import { authMiddleware } from '../../middlewares/authMiddleware';

// Router para as rotas privadas (exigem autenticação)
// ✅ CORREÇÃO: Exportado diretamente como uma constante nomeada (named export)
export const pagamentosRoutesPrivadas = Router();
pagamentosRoutesPrivadas.post('/preferencia', authMiddleware, createPaymentPreference);

// Router para as rotas públicas (não exigem autenticação)
// ✅ CORREÇÃO: Exportado diretamente como uma constante nomeada (named export)
export const pagamentosRoutesPublicas = Router();
pagamentosRoutesPublicas.post('/webhook', handleWebhook);

