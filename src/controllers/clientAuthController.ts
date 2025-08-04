import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../database/connection';

// Gera uma senha temporária segura
function generateTempPassword(length = 12): string {
  return crypto.randomBytes(length * 2)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

// Configuração do Nodemailer (requere SMTP_*)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response) {
  const { nome, email, senha, cpf, telefone } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  try {
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO clientes
         (nome, email, senha_hash, cpf, telefone, criado_em)
       VALUES ($1,$2,$3,$4,$5,NOW())
       RETURNING id, nome, email`,
      [nome, email, hash, cpf || null, telefone || null]
    );
    const cliente = rows[0];
    return res.status(201).json(cliente);
  } catch (err: any) {
    console.error('REGISTER ERROR:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, senha_hash FROM clientes WHERE email=$1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const cliente = rows[0];
    const match = await bcrypt.compare(senha, cliente.senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    return res.json({ id: cliente.id, nome: cliente.nome, email });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail obrigatório.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, nome FROM clientes WHERE email=$1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'E-mail não cadastrado.' });
    }
    const { id, nome } = rows[0];
    const tempPwd = generateTempPassword();
    const hash = await bcrypt.hash(tempPwd, 10);
    await pool.query('UPDATE clientes SET senha_hash=$1 WHERE id=$2', [hash, id]);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Roupp – Sua nova senha temporária',
      text: `Olá ${nome},\n\nSua senha foi resetada. Use esta senha temporária:\n\n${tempPwd}\n\nDepois altere-a em seu perfil.`,
    });
    return res.json({ message: 'Senha temporária enviada por e-mail.' });
  } catch (err) {
    console.error('FORGOT-PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erro ao resetar senha.' });
  }
}

/**
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response) {
  const { email, senha_atual, senha_nova } = req.body;
  if (!email || !senha_atual || !senha_nova) {
    return res.status(400).json({ error: 'E-mail, senha atual e nova são obrigatórios.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, senha_hash FROM clientes WHERE email=$1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    const { id, senha_hash } = rows[0];
    const match = await bcrypt.compare(senha_atual, senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    const newHash = await bcrypt.hash(senha_nova, 10);
    await pool.query('UPDATE clientes SET senha_hash=$1 WHERE id=$2', [newHash, id]);
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('CHANGE-PASSWORD ERROR:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
}
