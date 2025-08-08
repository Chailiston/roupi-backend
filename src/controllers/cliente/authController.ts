// src/controllers/cliente/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../../database/connection';

// helper: gera string aleatória segura
function generateTempPassword(): string {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `Roupp${randomNumber}`;
}

// configurando Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  }
});

// POST /api/cliente/auth/register
export async function register(req: Request, res: Response) {
  const { nome, email, senha, telefone, cpf } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  try {
    const check = await pool.query(
      'SELECT 1 FROM clientes WHERE email = $1',
      [email]
    );
    if ((check.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }
    const hash = await bcrypt.hash(senha, 10);
    const insert = await pool.query(
      `INSERT INTO clientes
         (nome, email, senha_hash, telefone, cpf, criado_em)
       VALUES ($1,$2,$3,$4,$5,NOW())
       RETURNING id`,
      [nome, email, hash, telefone, cpf]
    );
    return res.status(201).json({ id: insert.rows[0].id });
  } catch (err: any) {
    console.error('❌ REGISTER CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar cliente.', detail: err.message });
  }
}

// POST /api/cliente/auth/login
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, nome, senha_hash FROM clientes WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const { id, nome, senha_hash } = result.rows[0];
    if (!(await bcrypt.compare(senha, senha_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    return res.json({ id, nome });
  } catch (err: any) {
    console.error('❌ LOGIN CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao efetuar login.', detail: err.message });
  }
}

// POST /api/cliente/auth/forgot-password
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail obrigatório.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, nome FROM clientes WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'E-mail não cadastrado.' });
    }
    const { id: clienteId, nome } = result.rows[0];
    const tempPwd = generateTempPassword();
    console.log(`🛠️  [DEBUG] Senha temporária para ${email}: ${tempPwd}`);
    const hash = await bcrypt.hash(tempPwd, 10);
    await pool.query(
      'UPDATE clientes SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [hash, clienteId]
    );
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Sua senha provisória — Roupp App',
      text: `Olá ${nome},\n\nSua senha provisória é:\n\n${tempPwd}\n\nPor favor, faça login e altere sua senha para uma de sua escolha.\n\n— Equipe Roupp`
    });
    return res.json({ message: 'Senha provisória enviada por e-mail.' });
  } catch (err: any) {
    console.error('❌ FORGOT-PASSWORD CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao resetar senha.', detail: err.message });
  }
}

// POST /api/cliente/auth/change-password
export async function changePassword(req: Request, res: Response) {
  const { email, senha_atual, senha_nova } = req.body;
  if (!email || !senha_atual || !senha_nova) {
    return res.status(400).json({ error: 'E-mail, senha atual e nova são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, senha_hash FROM clientes WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const { id, senha_hash } = result.rows[0];
    if (!(await bcrypt.compare(senha_atual, senha_hash))) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    const newHash = await bcrypt.hash(senha_nova, 10);
    await pool.query(
      'UPDATE clientes SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
      [newHash, id]
    );
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    console.error('❌ CHANGE-PASSWORD CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha.', detail: err.message });
  }
}

// GET /api/cliente/auth/profile/:id
export async function getProfile(req: Request, res: Response) {
  const clienteId = Number(req.params.id);
  try {
    const result = await pool.query(
      `SELECT 
         id, nome, email, telefone, cpf,
         criado_em AS criadoEm,
         atualizado_em AS atualizadoEm
       FROM clientes
       WHERE id = $1`,
      [clienteId]
    );
    return res.json(result.rows[0] || null);
  } catch (err: any) {
    console.error('❌ GET-PROFILE CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao buscar perfil.', detail: err.message });
  }
}

// PUT /api/cliente/auth/profile/:id
export async function updateProfile(req: Request, res: Response) {
  const clienteId = Number(req.params.id);
  const { nome, telefone } = req.body;
  try {
    await pool.query(
      `UPDATE clientes
         SET nome = $1,
             telefone = $2,
             atualizado_em = NOW()
       WHERE id = $3`,
      [nome, telefone, clienteId]
    );
    const result = await pool.query(
      `SELECT 
         id, nome, email, telefone, cpf,
         criado_em AS criadoEm,
         atualizado_em AS atualizadoEm
       FROM clientes
       WHERE id = $1`,
      [clienteId]
    );
    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ UPDATE-PROFILE CLIENT ERROR:', err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.', detail: err.message });
  }
}
