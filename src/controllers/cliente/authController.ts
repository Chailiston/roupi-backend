// backend/src/controllers/cliente/authController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection'; // Usando a mesma conexão do seu projeto
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- Função de Registro de Novo Cliente ---
export const register = async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        // 1. Verifica se o e-mail já está em uso
        const existingUserResult = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }

        // 2. Criptografa a senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // 3. Cria o novo cliente no banco de dados (usando a coluna 'senha_hash')
        const newUserResult = await pool.query(
            'INSERT INTO clientes (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, hashedPassword]
        );
        const newCliente = newUserResult.rows[0];

        // 4. Gera um token JWT
        const token = jwt.sign({ id: newCliente.id, email: newCliente.email }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // 5. Retorna a resposta
        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token,
            user: newCliente,
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar.' });
    }
};

// --- Função de Login de Cliente ---
export const login = async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // 1. Encontra o usuário pelo e-mail
        const result = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const cliente = result.rows[0];

        // Não permite login com senha para contas criadas via Google (que não têm senha_hash)
        if (!cliente.senha_hash) {
            return res.status(401).json({ message: 'Use o login com Google para esta conta.' });
        }

        // 2. Compara a senha (usando a coluna 'senha_hash')
        const isPasswordCorrect = await bcrypt.compare(senha, cliente.senha_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // 3. Gera o token JWT
        const token = jwt.sign({ id: cliente.id, email: cliente.email }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // 4. Retorna a resposta
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
            },
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
};

// --- Função de Login com Google ---
export const googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: 'Token do Google não fornecido.' });
    }

    try {
        // 1. Verifica o token com o Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.name) {
            return res.status(401).json({ message: 'Token do Google inválido.' });
        }
        
        const { email, name, picture } = payload;

        // 2. Procura ou cria o usuário no banco (UPSERT)
        const upsertQuery = `
            INSERT INTO clientes (email, nome, foto_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE 
            SET nome = EXCLUDED.nome, foto_url = EXCLUDED.foto_url
            RETURNING id, email, nome, foto_url;
        `;
        const userResult = await pool.query(upsertQuery, [email, name, picture]);
        const user = userResult.rows[0];

        // 3. Gera o nosso próprio token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // 4. Retorna os dados para o app
        res.status(200).json({
            message: 'Login com Google bem-sucedido!',
            token,
            user,
        });

    } catch (error) {
        console.error('Erro no login com Google:', error);
        res.status(500).json({ message: 'Erro interno do servidor durante o login com Google.' });
    }
};
