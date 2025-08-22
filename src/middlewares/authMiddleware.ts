// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ ADICIONA A MESMA LÓGICA DE FALLBACK DO CONTROLLER
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';

interface JwtPayload {
  id: number;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number };
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = header.split(' ')[1];
  try {
    // ✅ USA A VARIÁVEL JWT_SECRET CONSISTENTE
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = { id: payload.id };
    
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
