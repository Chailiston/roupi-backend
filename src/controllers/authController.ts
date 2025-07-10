// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../database/connection';

export async function register(req: Request, res: Response) {
  const { nome, cnpj, email, senha } = req.body;
  // ① log do corpo
  console.log('🔐 REGISTER BODY:', req.body);

  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO lojas (
         nome, cnpj, email, senha_hash, criado_em
       ) VALUES ($1,$2,$3,$4,NOW())
       RETURNING id`,
      [nome, cnpj, email, hash]
    );
    return res.status(201).json({ id: result.rows[0].id });
  } catch (err: any) {
    // ② log do erro completo
    console.error('❌ REGISTER ERROR:', err);
    // Incluindo até a mensagem no JSON para ajudarmos a debugar
    return res.status(500).json({
      error: 'Erro ao cadastrar loja',
      detail: err.message
    });
  }
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  // ... seu código de login ...
}
