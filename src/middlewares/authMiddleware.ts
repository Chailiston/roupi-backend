import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ CORREÇÃO: Segredo JWT consistente e mais seguro.
// Este valor DEVE ser o mesmo usado no seu authController.ts
// O ideal é configurar esta variável no seu ambiente do Render.
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto-e-dificil-de-adivinhar-agora-consistente';

interface JwtPayload {
  id: number;
  email: string;
}

// Permite adicionar a propriedade 'user' ao objeto Request do Express
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number };
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
  }

  const token = header.split(' ')[1];
  try {
    // Tenta verificar o token com o segredo
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Anexa o ID do usuário à requisição para ser usado nos próximos controllers
    req.user = { id: payload.id };
    
    next(); // Passa para o próximo middleware ou controller
  } catch {
    // Se jwt.verify falhar (assinatura inválida, expirado, etc.), retorna o erro 401
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
