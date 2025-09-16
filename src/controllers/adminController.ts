import { Request, Response } from 'express';
import { pool } from '../database/connection';
import bcrypt from 'bcryptjs';


// Listar todos os admins
export const listarAdmins = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT id, nome, email, criado_em FROM admins');
  res.json(result.rows);
};

// Criar um novo admin
export const criarAdmin = async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);

    await pool.query(
      'INSERT INTO admins (nome, email, senha) VALUES ($1, $2, $3)',
      [nome, email, hash]
    );

    res.status(201).json({ message: 'Admin criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar admin' });
  }
};

// Login do admin (simples)
export const loginAdmin = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email não encontrado' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(senha, admin.senha);

    if (!match) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Aqui poderia gerar um token JWT futuramente
    res.status(200).json({ message: 'Login realizado com sucesso', admin: { id: admin.id, nome: admin.nome } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login do admin' });
  }
};
