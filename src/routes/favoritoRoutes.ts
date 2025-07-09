import { Router } from 'express';
import {
  getFavoritosPorCliente,
  addFavorito,
  removeFavorito,
} from '../controllers/favoritoController';

const router = Router();

router.get('/clientes/:cliente_id/favoritos', getFavoritosPorCliente);
router.post('/favoritos', addFavorito);
router.delete('/favoritos/:cliente_id/:produto_id', removeFavorito);

export default router;
