// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../database/connection';

// helper: gera string aleatória segura
function generateTempPassword(length = 12): string {
  return crypto.randomBytes(length * 2)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

// configurando Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const { nome, cnpj, email, senha } = req.body;
  if (!nome || !cnpj || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO lojas (nome, cnpj, email, senha_hash, onboarded, criado_em)
       VALUES ($1,$2,$3,$4,FALSE,NOW()) RETURNING id, onboarded`,
      [nome, cnpj, email, hash]
    );
    const loja = result.rows[0];
    return res.status(201).json({ id: loja.id, onboarded: loja.onboarded });
  } catch (err: any) {
    console.error('❌ REGISTER ERROR:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este CNPJ ou E‑mail já está cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar loja', detail: err.message });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'E‑mail e senha são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nome, senha_hash, onboarded FROM lojas WHERE email=$1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E‑mail ou senha inválidos.' });
    }
    const loja = result.rows[0];
    const match = await bcrypt.compare(senha, loja.senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'E‑mail ou senha inválidos.' });
    }
    return res.status(200).json({ id: loja.id, nome: loja.nome, onboarded: loja.onboarded });
  } catch (err: any) {
    console.error('❌ LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Erro ao efetuar login', detail: err.message });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E‑mail obrigatório.' });
  }
  try {
    const { rows } = await pool.query('SELECT id, nome FROM lojas WHERE email=$1', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'E‑mail não cadastrado.' });
    }
    const { id: lojaId, nome } = rows[0];
    const tempPwd = generateTempPassword(12);
    const hash = await bcrypt.hash(tempPwd, 10);
    await pool.query('UPDATE lojas SET senha_hash=$1 WHERE id=$2', [hash, lojaId]);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Sua nova senha — Roupp App',
      text: `Olá ${nome},\n\nSua senha foi resetada. Use esta senha temporária:\n\n${tempPwd}\n\n— Equipe Roupp`
    });
    return res.json({ message: 'Nova senha enviada por e‑mail.' });
  } catch (err: any) {
    console.error('❌ FORGOT-PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erro ao resetar senha', detail: err.message });
  }
}

// POST /api/auth/change-password
export async function changePassword(req: Request, res: Response) {
  const { email, senha_atual, senha_nova } = req.body;
  if (!email || !senha_atual || !senha_nova) {
    return res.status(400).json({ error: 'E‑mail, senha atual e nova são obrigatórios.' });
  }
  try {
    const result = await pool.query('SELECT id, senha_hash FROM lojas WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const { id, senha_hash } = result.rows[0];
    const match = await bcrypt.compare(senha_atual, senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    const newHash = await bcrypt.hash(senha_nova, 10);
    await pool.query('UPDATE lojas SET senha_hash=$1 WHERE id=$2', [newHash, id]);
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    console.error('❌ CHANGE-PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha', detail: err.message });
  }
}
