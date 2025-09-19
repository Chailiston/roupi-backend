import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estende a interface Request do Express para incluir a propriedade 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

// Garante que o JWT_SECRET seja carregado a partir das variáveis de ambiente.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('A variável de ambiente JWT_SECRET não está definida.');
}


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log(`--- Middleware de autenticação acionado para a rota: ${req.path} ---`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acesso negado. O token de autenticação não foi fornecido ou está mal formatado.',
        code: 'NO_TOKEN_PROVIDED' 
    });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ 
            message: 'Acesso negado. Token ausente após o prefixo "Bearer".',
            code: 'MALFORMED_TOKEN' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; iat: number; exp: number };
        req.user = { id: decoded.id, email: decoded.email };
        next();

    } catch (error) {
        // ✅ CORREÇÃO: Verificamos se 'error' é um objeto de Erro antes de acessar 'error.message'
        if (error instanceof Error) {
            console.error('Erro de autenticação no middleware:', error.message);
        } else {
            console.error('Erro de autenticação desconhecido no middleware:', error);
        }
        
        let errorMessage = 'Token inválido.';
        let errorCode = 'INVALID_TOKEN';

        if (error instanceof jwt.TokenExpiredError) {
            errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
            errorCode = 'TOKEN_EXPIRED';
        } else if (error instanceof jwt.JsonWebTokenError) {
            errorMessage = 'O token fornecido é inválido.';
            errorCode = 'TOKEN_INVALID';
        }
        
        return res.status(401).json({ message: errorMessage, code: errorCode });
    }
};
