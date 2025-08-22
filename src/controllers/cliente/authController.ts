// backend/src/controllers/cliente/authController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const register = async (req: Request, res: Response) => {
    const { nome, email, senha, cpf } = req.body;
    if (!nome || !email || !senha || !cpf) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    try {
        const existingUserResult = await pool.query('SELECT id FROM clientes WHERE email = $1 OR cpf = $2', [email, cpf]);
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: 'E-mail ou CPF já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUserResult = await pool.query(
            'INSERT INTO clientes (nome, email, senha_hash, cpf) VALUES ($1, $2, $3, $4) RETURNING id, nome, email',
            [nome, email, hashedPassword, cpf]
        );
        const newCliente = newUserResult.rows[0];
        const token = jwt.sign({ id: newCliente.id, email: newCliente.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ message: 'Usuário registrado com sucesso!', token, user: newCliente });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const result = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const cliente = result.rows[0];
        if (!cliente.senha_hash) {
            return res.status(401).json({ message: 'Use o login com Google para esta conta.' });
        }
        const isPasswordCorrect = await bcrypt.compare(senha, cliente.senha_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: cliente.id, email: cliente.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                mustResetPassword: cliente.senha_temporaria 
            },
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O e-mail é obrigatório.' });
    }
    try {
        const userResult = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, uma nova senha será enviada.' });
        }
        const user = userResult.rows[0];
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await pool.query(
            'UPDATE clientes SET senha_hash = $1, senha_temporaria = TRUE WHERE id = $2',
            [hashedPassword, user.id]
        );
        // ✅ TEXTO DO E-MAIL RESTAURADO
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Sua nova senha temporária - Roupp',
            html: `
                <p>Olá ${user.nome},</p>
                <p>Você solicitou uma redefinição de senha. Use a senha temporária abaixo para acessar sua conta:</p>
                <h2 style="text-align: center; letter-spacing: 2px;">${tempPassword}</h2>
                <p>Por segurança, você será solicitado a criar uma nova senha assim que fizer o login.</p>
                <p>Atenciosamente,<br>Equipe Roupp</p>
            `,
        });
        res.status(200).json({ message: 'Se o e-mail estiver cadastrado, uma nova senha será enviada.' });
    } catch (error) {
        console.error('Erro no forgotPassword:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { newPassword } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Não autorizado. Faça o login novamente.' });
    }
    if (!newPassword) {
        return res.status(400).json({ message: 'A nova senha é obrigatória.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE clientes SET senha_hash = $1, senha_temporaria = FALSE WHERE id = $2',
            [hashedPassword, userId]
        );
        res.status(200).json({ message: 'Senha atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro no resetPassword:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ message: 'Token do Google não fornecido.' });
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name) {
            return res.status(401).json({ message: 'Token do Google inválido.' });
        }
        const { email, name, picture } = payload;
        const upsertQuery = `
            INSERT INTO clientes (email, nome, foto_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE 
            SET nome = EXCLUDED.nome, foto_url = EXCLUDED.foto_url
            RETURNING id, email, nome, foto_url;
        `;
        const userResult = await pool.query(upsertQuery, [email, name, picture]);
        const user = userResult.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '7d',
        });
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
