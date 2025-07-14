import { Router } from 'express';
import {
  getPromocoes,
  getPromocaoById,
  createPromocao,
  updatePromocao,
  toggleAtivo,
  deletePromocao
} from '../controllers/promocaoController';

const router = Router();

// CRUD
router.get('/',            getPromocoes);
router.get('/:id',         getPromocaoById);
router.post('/',           createPromocao);
router.put('/:id',         updatePromocao);
router.patch('/:id/ativo', toggleAtivo);
router.delete('/:id',      deletePromocao);

export default router;
