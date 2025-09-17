"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// CORREÇÃO: Usar um segredo consistente e forte. Este deve ser o mesmo do authController.
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-consistente-para-gerar-e-validar-tokens-jwt-2025';
const authMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // 5. Anexa os dados do usuário decodificados ao objeto 'req'
        req.user = { id: decoded.id, email: decoded.email };
        // 6. Passa para a próxima função (o controller)
        next();
    }
    catch (error) {
        // 7. Se a verificação falhar (token inválido, expirado, etc.), retorna um erro
        console.error('Erro de autenticação:', error);
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};
exports.authMiddleware = authMiddleware;
