"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Garante que o JWT_SECRET seja carregado a partir das variáveis de ambiente.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('A variável de ambiente JWT_SECRET não está definida.');
}
const authMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email };
        next();
    }
    catch (error) {
        // ✅ CORREÇÃO: Verificamos se 'error' é um objeto de Erro antes de acessar 'error.message'
        if (error instanceof Error) {
            console.error('Erro de autenticação no middleware:', error.message);
        }
        else {
            console.error('Erro de autenticação desconhecido no middleware:', error);
        }
        let errorMessage = 'Token inválido.';
        let errorCode = 'INVALID_TOKEN';
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
            errorCode = 'TOKEN_EXPIRED';
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            errorMessage = 'O token fornecido é inválido.';
            errorCode = 'TOKEN_INVALID';
        }
        return res.status(401).json({ message: errorMessage, code: errorCode });
    }
};
exports.authMiddleware = authMiddleware;
