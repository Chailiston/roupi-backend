import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { admin } from '../../config/firebaseAdmin';
import { transporter } from '../../config/nodemailer';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('A variável de ambiente JWT_SECRET não está definida.');
}

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
        res.status(201).json({ message: 'Utilizador registado com sucesso!', token, user: newCliente });
    } catch (error) {
        console.error('Erro detalhado no registo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registar.' });
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
        
        // ✅ LÓGICA ATUALIZADA: Verifica se o login foi feito com senha temporária
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
            },
            // Envia a flag para o frontend
            requirePasswordChange: cliente.senha_temporaria 
        });
    } catch (error) {
        console.error('Erro detalhado no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
};

/**
 * @description Gera e envia uma senha temporária para o utilizador.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O e-mail é obrigatório.' });
    }
    try {
        const userResult = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            console.log(`Tentativa de recuperação para e-mail não cadastrado: ${email}`);
            return res.status(200).json({ message: 'Se o e-mail estiver registado, uma senha temporária será enviada.' });
        }
        
        const user = userResult.rows[0];
        
        // ✅ LÓGICA ATUALIZADA: Gera senha temporária
        const temporaryPassword = randomBytes(4).toString('hex').toUpperCase(); // Gera 8 caracteres hexadecimais
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Atualiza o banco com a nova senha e a flag
        await pool.query(
            'UPDATE clientes SET senha_hash = $1, senha_temporaria = $2, atualizado_em = NOW() WHERE id = $3',
            [hashedPassword, true, user.id]
        );

        // Envia o e-mail com a senha
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Sua Senha Temporária - Rouppi',
            html: `<p>Olá ${user.nome},</p>
                   <p>Você solicitou a redefinição da sua senha. Use a senha temporária abaixo para aceder à sua conta:</p>
                   <h2 style="text-align: center; letter-spacing: 2px; border: 1px solid #ddd; padding: 10px;">${temporaryPassword}</h2>
                   <p>Por segurança, você será solicitado a criar uma nova senha definitiva assim que fizer o login.</p>
                   <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>`,
        });
        
        console.log(`Senha temporária enviada para: ${user.email}`);
        res.status(200).json({ message: 'Se o e-mail estiver registado, uma senha temporária será enviada.' });

    } catch (error) {
        console.error('Erro detalhado no forgotPassword:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar a solicitação.' });
    }
};


// 🚨 FUNÇÃO REMOVIDA: A função `resetPassword` com token não é mais necessária neste fluxo.
// A alteração de senha será feita pelo `updatePassword` no `profileController` após o login.

export const googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ message: 'Token do Google não fornecido.' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;
        if (!email || !name) {
            return res.status(401).json({ message: 'Token do Google inválido ou sem informações suficientes.' });
        }
        const upsertQuery = `
            INSERT INTO clientes (email, nome, foto_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE 
            SET nome = EXCLUDED.nome, foto_url = EXCLUDED.foto_url
            RETURNING id, email, nome, foto_url, senha_temporaria;
        `;
        const userResult = await pool.query(upsertQuery, [email, name, picture]);
        const user = userResult.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login com Google bem-sucedido!',
            token,
            user,
            requirePasswordChange: user.senha_temporaria 
        });
    } catch (error) {
        console.error('Erro detalhado no login com Google:', error);
        res.status(500).json({ message: 'Autenticação com Google falhou. Token inválido ou expirado.' });
    }
};
