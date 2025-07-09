import { Router } from 'express';
import {
  getNotificacoesPorCliente,
  createNotificacao,
  marcarComoLida
} from '../controllers/notificacaoController';

const router = Router();

router.get('/notificacoes/:cliente_id', getNotificacoesPorCliente);
router.post('/notificacoes', createNotificacao);
router.put('/notificacoes/:id/lida', marcarComoLida);

export default router;
