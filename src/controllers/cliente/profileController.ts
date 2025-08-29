// src/controllers/cliente/profileController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import bcrypt from 'bcryptjs';

// =====================================================================
// ✅ FUNÇÃO AUXILIAR PARA VALIDAÇÃO DE CPF
// =====================================================================
/**
 * Valida um CPF brasileiro.
 * @param cpf - O CPF como string (pode conter pontuação).
 * @returns `true` se o CPF for válido, `false` caso contrário.
 */
const isValidCPF = (cpf: string | null | undefined): boolean => {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cpfClean = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos e se não são todos iguais
    if (cpfClean.length !== 11 || /^(\d)\1{10}$/.test(cpfClean)) {
        return false;
    }

    let sum = 0;
    let remainder: number;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }
    if (remainder !== parseInt(cpfClean.substring(9, 10))) {
        return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
        remainder = 0;
    }
    if (remainder !== parseInt(cpfClean.substring(10, 11))) {
        return false;
    }

    return true;
};


/**
 * @route GET /api/cliente/profile
 * @description Busca os dados do perfil do cliente logado.
 */
export const getProfile = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;

    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, nome, email, telefone, cpf, foto_url FROM clientes WHERE id = $1',
            [clienteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar perfil do cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * @route PUT /api/cliente/profile
 * @description Atualiza os dados do perfil do cliente logado.
 */
export const updateProfile = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;
    const { nome, telefone, cpf } = req.body;

    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    if (!nome && !telefone && !cpf) {
        return res.status(400).json({ message: 'Nenhum dado para atualizar foi fornecido.' });
    }

    try {
        // ✅ NOVA VALIDAÇÃO: Se um CPF foi fornecido, valide-o
        if (cpf) {
            // 1. Validar o formato do CPF
            if (!isValidCPF(cpf)) {
                return res.status(400).json({ message: 'O CPF fornecido é inválido.' });
            }

            // 2. Verificar se o CPF já está em uso por outro cliente
            const existingCpfResult = await pool.query(
                'SELECT id FROM clientes WHERE cpf = $1 AND id != $2',
                [cpf, clienteId]
            );

            if (existingCpfResult.rows.length > 0) {
                // HTTP 409: Conflict
                return res.status(409).json({ message: 'Este CPF já está em uso por outra conta.' });
            }
        }

        const currentUserResult = await pool.query('SELECT nome, telefone, cpf FROM clientes WHERE id = $1', [clienteId]);
        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        const currentUser = currentUserResult.rows[0];

        const updatedUser = {
            nome: nome || currentUser.nome,
            telefone: telefone || currentUser.telefone,
            cpf: cpf || currentUser.cpf,
        };

        const result = await pool.query(
            `UPDATE clientes SET nome = $1, telefone = $2, cpf = $3, atualizado_em = NOW()
             WHERE id = $4
             RETURNING id, nome, email, telefone, cpf, foto_url`,
            [updatedUser.nome, updatedUser.telefone, updatedUser.cpf, clienteId]
        );

        res.status(200).json({
            message: 'Perfil atualizado com sucesso!',
            user: result.rows[0],
        });

    } catch (error: any) {
        // Fallback para o caso de a constraint do banco de dados ser violada
        if (error.code === '23505' && error.constraint?.includes('cpf')) {
             return res.status(409).json({ message: 'Este CPF já está em uso por outra conta.' });
        }
        console.error('Erro ao atualizar perfil do cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};


/**
 * @route PUT /api/cliente/profile/password
 * @description Atualiza a senha do cliente logado.
 */
export const updatePassword = async (req: Request, res: Response) => {
    const clienteId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const result = await pool.query('SELECT senha_hash FROM clientes WHERE id = $1', [clienteId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'A senha atual está incorreta.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE clientes SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2',
            [newPasswordHash, clienteId]
        );

        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

