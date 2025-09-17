import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estenda a interface Request do Express para incluir a propriedade 'user'
declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string };
        }
    }
}

// CORREÇÃO DEFINITIVA: Usar um segredo consistente e forte. Este deve ser o mesmo do authController.
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-consistente-para-gerar-e-validar-tokens-jwt-2025';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // PASSO DE DIAGNÓSTICO: Esta mensagem deve aparecer no seu terminal do servidor.
    console.log("--- EXECUTANDO O MIDDLEWARE DE AUTENTICAÇÃO (VERSÃO CORRIGIDA) ---");

    // 1. Pega o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;

    // 2. Verifica se o cabeçalho existe e se está no formato 'Bearer [token]'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    // 3. Verifica se o token existe após o 'Bearer'
    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token mal formatado.' });
    }

    try {
        // 4. Tenta verificar o token com o segredo
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; iat: number; exp: number };
        
        // 5. Anexa os dados do usuário decodificados ao objeto 'req'
        req.user = { id: decoded.id, email: decoded.email };
        
        // 6. Passa para a próxima função (o controller)
        next();
    } catch (error) {
        // 7. Se a verificação falhar (token inválido, expirado, etc.), retorna um erro
        console.error('Erro de autenticação:', error);
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

