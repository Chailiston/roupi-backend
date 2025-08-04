// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  clientId: number;
}

// Estende a interface Request para incluir `user`
declare module 'express-serve-static-core' {
  interface Request {
    user?: { clientId: number };
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = { clientId: payload.clientId };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
