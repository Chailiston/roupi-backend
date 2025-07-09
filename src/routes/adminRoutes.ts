import { Router } from 'express';
import { listarAdmins, criarAdmin, loginAdmin } from '../controllers/adminController';

const router = Router();

router.get('/', listarAdmins);
router.post('/', criarAdmin);
router.post('/login', loginAdmin);

export default router;
