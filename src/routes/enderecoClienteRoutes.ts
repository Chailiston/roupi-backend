import { Router } from 'express';
import {
  getEnderecosPorCliente,
  createEndereco,
  updateEndereco,
  deleteEndereco
} from '../controllers/enderecoClienteController';

const router = Router();

router.get('/clientes/:id/enderecos', getEnderecosPorCliente);
router.post('/enderecos', createEndereco);
router.put('/enderecos/:id', updateEndereco);
router.delete('/enderecos/:id', deleteEndereco);

export default router;
