import express, { Request, Response } from 'express';
import upload from '../utils/upload';
import path from 'path';

const router = express.Router();

/**
 * POST /api/upload/imagem
 * Envia imagem e retorna a URL do arquivo salvo
 */
router.post(
  '/imagem',
  upload.single('arquivo'), // o nome do campo no formulário deve ser "arquivo"
  (req: Request & { file?: Express.Multer.File }, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      message: 'Upload realizado com sucesso!',
      imageUrl,
    });
  }
);

export default router;
