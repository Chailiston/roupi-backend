import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../database/connection';

export async function register(req: Request, res: Response) {
  const { nome, cnpj, email, senha } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO lojas (nome, cnpj, email, senha_hash, criado_em)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id`,
      [nome, cnpj, email, hash]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar loja' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM lojas WHERE email = $1`, [email]);
    if (!rows.length) return res.status(404).json({ error: 'Loja não encontrada' });
    const loja = rows[0];
    const match = await bcrypt.compare(senha, loja.senha_hash);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });
    res.json({ id: loja.id, nome: loja.nome });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
}
