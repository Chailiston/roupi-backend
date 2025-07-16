import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../database/connection';

// cria o transporter do nodemailer usando SMTP Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
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
       VALUES ($1, $2, $3, $4, FALSE, NOW())
       RETURNING id, onboarded`,
      [nome, cnpj, email, hash]
    );
    const loja = result.rows[0];
    return res.status(201).json({ id: loja.id, onboarded: loja.onboarded });
  } catch (err: any) {
    console.error('❌ REGISTER ERROR:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este CNPJ já está cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar loja', detail: err.message });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nome, senha_hash, onboarded
       FROM lojas
       WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const loja = result.rows[0];
    const match = await bcrypt.compare(senha, loja.senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
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
    return res.status(400).json({ error: 'E-mail obrigatório.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id FROM lojas WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'E‑mail não cadastrado' });
    }

    const lojaId = rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60000); // 30 minutos

    await pool.query(
      `INSERT INTO password_reset_tokens
       (id_loja, token, expires_at, criado_em, usado)
       VALUES ($1, $2, $3, NOW(), FALSE)`,
      [lojaId, token, expires]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // envia e‑mail com o link de redefinição
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Redefinição de senha – Rouppi App',
      html: `
        <p>Olá,</p>
        <p>Clique no link abaixo para redefinir sua senha (válido por 30 minutos):</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ou copie e cole este token no app:</p>
        <pre>${token}</pre>
      `
    });

    console.log(`>>> [forgotPassword] token gerado para loja ${lojaId}:`, token);
    // Em DEV, retornamos o token para facilitar testes
    return res.json({
      message: 'Verifique seu e‑mail para redefinir a senha',
      token
    });
  } catch (err: any) {
    console.error('❌ FORGOT-PASSWORD ERROR:', err);
    return res.status(500).json({
      error: 'Erro ao solicitar redefinição de senha',
      detail: err.message
    });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response) {
  const { token: rawToken, senha } = req.body;
  console.log('>>> [resetPassword] rawToken:', JSON.stringify(rawToken));
  const token = String(rawToken).trim();
  console.log('>>> [resetPassword] token (trimmed):', token);

  if (!token || !senha) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id_loja FROM password_reset_tokens
       WHERE token = $1
         AND expires_at > NOW()
         AND usado = FALSE`,
      [token]
    );
    console.log('>>> [resetPassword] lookup rows:', rows);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const lojaId = rows[0].id_loja;
    // exige extensão pgcrypto: CREATE EXTENSION IF NOT EXISTS pgcrypto;
    await pool.query(
      `UPDATE lojas
         SET senha_hash = crypt($1, gen_salt('bf', 8))
       WHERE id = $2`,
      [senha, lojaId]
    );
    console.log(`>>> [resetPassword] senha_hash atualizada para loja ${lojaId}`);

    await pool.query(
      `UPDATE password_reset_tokens
         SET usado = TRUE
       WHERE token = $1`,
      [token]
    );
    console.log(`>>> [resetPassword] token marcado como usado`);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err: any) {
    console.error('❌ RESET-PASSWORD ERROR:', err);
    return res.status(500).json({
      error: 'Erro ao redefinir senha',
      detail: err.message
    });
  }
}
