"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcrypt_1 = __importDefault(require("bcrypt"));
const connection_1 = require("../database/connection");
async function register(req, res) {
    const { nome, cnpj, email, senha } = req.body;
    if (!nome || !cnpj || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    console.log('🔐 REGISTER BODY:', req.body);
    try {
        const hash = await bcrypt_1.default.hash(senha, 10);
        const result = await connection_1.pool.query(`INSERT INTO lojas (nome, cnpj, email, senha_hash, onboarded, criado_em)
       VALUES ($1, $2, $3, $4, FALSE, NOW())
       RETURNING id, onboarded`, [nome, cnpj, email, hash]);
        const loja = result.rows[0];
        return res.status(201).json({ id: loja.id, onboarded: loja.onboarded });
    }
    catch (err) {
        console.error('❌ REGISTER ERROR:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Este CNPJ já está cadastrado.' });
        }
        return res.status(500).json({ error: 'Erro ao cadastrar loja', detail: err.message });
    }
}
async function login(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    console.log('🔑 LOGIN BODY:', req.body);
    try {
        const result = await connection_1.pool.query(`SELECT id, nome, senha_hash, onboarded
       FROM lojas
       WHERE email = $1`, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
        const loja = result.rows[0];
        const match = await bcrypt_1.default.compare(senha, loja.senha_hash);
        if (!match) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
        return res.status(200).json({ id: loja.id, nome: loja.nome, onboarded: loja.onboarded });
    }
    catch (err) {
        console.error('❌ LOGIN ERROR:', err);
        return res.status(500).json({ error: 'Erro ao efetuar login', detail: err.message });
    }
}
