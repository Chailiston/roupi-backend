import { Request, Response } from 'express';
import { pool } from '../database/connection';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND ativo = true', [email]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'E-mail não encontrado ou usuário inativo' });
    }

const senhaCorreta = senha === admin.senha_hash;


    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, perfil: admin.perfil },
      process.env.JWT_SECRET || 'roupi_secret',
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email, perfil: admin.perfil } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no login' });
  }
};
