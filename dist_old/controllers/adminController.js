"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = exports.criarAdmin = exports.listarAdmins = void 0;
const connection_1 = require("../database/connection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Listar todos os admins
const listarAdmins = async (_req, res) => {
    const result = await connection_1.pool.query('SELECT id, nome, email, criado_em FROM admins');
    res.json(result.rows);
};
exports.listarAdmins = listarAdmins;
// Criar um novo admin
const criarAdmin = async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hash = await bcryptjs_1.default.hash(senha, 10);
        await connection_1.pool.query('INSERT INTO admins (nome, email, senha) VALUES ($1, $2, $3)', [nome, email, hash]);
        res.status(201).json({ message: 'Admin criado com sucesso' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar admin' });
    }
};
exports.criarAdmin = criarAdmin;
// Login do admin (simples)
const loginAdmin = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await connection_1.pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email não encontrado' });
        }
        const admin = result.rows[0];
        const match = await bcryptjs_1.default.compare(senha, admin.senha);
        if (!match) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        // Aqui poderia gerar um token JWT futuramente
        res.status(200).json({ message: 'Login realizado com sucesso', admin: { id: admin.id, nome: admin.nome } });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro no login do admin' });
    }
};
exports.loginAdmin = loginAdmin;
