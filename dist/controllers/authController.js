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
    try {
        const hash = await bcrypt_1.default.hash(senha, 10);
        const result = await connection_1.pool.query(`INSERT INTO lojas (nome, cnpj, email, senha_hash, criado_em)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id`, [nome, cnpj, email, hash]);
        res.status(201).json({ id: result.rows[0].id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar loja' });
    }
}
async function login(req, res) {
    const { email, senha } = req.body;
    try {
        const { rows } = await connection_1.pool.query(`SELECT * FROM lojas WHERE email = $1`, [email]);
        if (!rows.length)
            return res.status(404).json({ error: 'Loja não encontrada' });
        const loja = rows[0];
        const match = await bcrypt_1.default.compare(senha, loja.senha_hash);
        if (!match)
            return res.status(401).json({ error: 'Senha incorreta' });
        res.json({ id: loja.id, nome: loja.nome });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no login' });
    }
}
