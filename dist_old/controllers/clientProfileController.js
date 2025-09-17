"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const connection_1 = require("../database/connection");
/**
 * GET /api/cliente/profile/:clientId
 */
async function getProfile(req, res) {
    const clientId = Number(req.params.clientId);
    try {
        const { rows } = await connection_1.pool.query(`SELECT
         id,
         nome,
         email,
         telefone,
         cpf,
         criado_em,
         atualizado_em
       FROM clientes
       WHERE id = $1`, [clientId]);
        if (!rows[0]) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        return res.json(rows[0]);
    }
    catch (err) {
        console.error('GET PROFILE ERROR:', err);
        return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
}
/**
 * PUT /api/cliente/profile/:clientId
 */
async function updateProfile(req, res) {
    const clientId = Number(req.params.clientId);
    const { nome, telefone, cpf } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    try {
        const { rowCount } = await connection_1.pool.query(`UPDATE clientes
         SET nome = $1,
             telefone = $2,
             cpf = $3,
             atualizado_em = NOW()
       WHERE id = $4`, [nome, telefone || null, cpf || null, clientId]);
        if (!rowCount) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        return res.json({ message: 'Perfil atualizado com sucesso.' });
    }
    catch (err) {
        console.error('UPDATE PROFILE ERROR:', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
}
