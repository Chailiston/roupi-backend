"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ✅ ADICIONA A MESMA LÓGICA DE FALLBACK DO CONTROLLER
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }
    const token = header.split(' ')[1];
    try {
        // ✅ USA A VARIÁVEL JWT_SECRET CONSISTENTE
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.id };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}
