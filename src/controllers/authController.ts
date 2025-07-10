// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../database/connection';

export async function register(req: Request, res: Response) {
  const { nome, cnpj, email, senha } = req.body;

  if (!nome || !cnpj || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  console.log('🔐 REGISTER BODY:', req.body);

  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO lojas (nome, cnpj, email, senha_hash, criado_em)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [nome, cnpj, email, hash]
    );
    return res.status(201).json({ id: result.rows[0].id });

  } catch (err: any) {
    console.error('❌ REGISTER ERROR:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este CNPJ já está cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar loja', detail: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  console.log('🔑 LOGIN BODY:', req.body);

  try {
    const result = await pool.query(
      `SELECT id, nome, senha_hash
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

    return res.status(200).json({ id: loja.id, nome: loja.nome });

  } catch (err: any) {
    console.error('❌ LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Erro ao efetuar login', detail: err.message });
  }
}
