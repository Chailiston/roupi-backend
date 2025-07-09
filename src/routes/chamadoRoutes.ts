import { Router } from 'express';
import {
  createChamado,
  getChamadosPorCliente,
  getMensagensChamado,
  createMensagemChamado
} from '../controllers/chamadoController';

const router = Router();

router.post('/chamados', createChamado);
router.get('/chamados/:cliente_id', getChamadosPorCliente);
router.get('/chamados/:chamado_id/mensagens', getMensagensChamado);
router.post('/chamados/mensagens', createMensagemChamado);

export default router;
