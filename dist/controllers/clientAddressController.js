"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddresses = getAddresses;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.deleteAddress = deleteAddress;
const connection_1 = require("../database/connection");
/**
 * GET /api/clientes/:clientId/enderecos
 */
async function getAddresses(req, res) {
    const clientId = Number(req.params.clientId);
    try {
        const { rows } = await connection_1.pool.query(`SELECT 
         id, apelido, rua, numero, complemento, bairro,
         cidade, estado, cep, padrao, criado_em
       FROM enderecos_cliente
       WHERE id_cliente = $1
       ORDER BY padrao DESC, criado_em DESC`, [clientId]);
        return res.json(rows);
    }
    catch (err) {
        console.error('GET ADDRESSES ERROR:', err);
        return res.status(500).json({ error: 'Erro ao buscar endereços.' });
    }
}
/**
 * POST /api/clientes/:clientId/enderecos
 */
async function createAddress(req, res) {
    const clientId = Number(req.params.clientId);
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, padrao } = req.body;
    if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }
    try {
        if (padrao) {
            await connection_1.pool.query('UPDATE enderecos_cliente SET padrao = FALSE WHERE id_cliente = $1', [clientId]);
        }
        const { rows } = await connection_1.pool.query(`INSERT INTO enderecos_cliente
         (id_cliente, apelido, rua, numero, complemento, bairro,
          cidade, estado, cep, padrao, criado_em)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`, [
            clientId,
            apelido || null,
            rua,
            numero,
            complemento || null,
            bairro,
            cidade,
            estado,
            cep,
            padrao || false
        ]);
        return res.status(201).json(rows[0]);
    }
    catch (err) {
        console.error('CREATE ADDRESS ERROR:', err);
        return res.status(500).json({ error: 'Erro ao criar endereço.' });
    }
}
/**
 * PUT /api/clientes/:clientId/enderecos/:addressId
 */
async function updateAddress(req, res) {
    const clientId = Number(req.params.clientId);
    const addressId = Number(req.params.addressId);
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, padrao } = req.body;
    if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }
    try {
        if (padrao) {
            await connection_1.pool.query('UPDATE enderecos_cliente SET padrao = FALSE WHERE id_cliente = $1', [clientId]);
        }
        const { rowCount } = await connection_1.pool.query(`UPDATE enderecos_cliente SET
         apelido     = $1,
         rua         = $2,
         numero      = $3,
         complemento = $4,
         bairro      = $5,
         cidade      = $6,
         estado      = $7,
         cep         = $8,
         padrao      = $9
       WHERE id_cliente = $10 AND id = $11`, [
            apelido || null,
            rua,
            numero,
            complemento || null,
            bairro,
            cidade,
            estado,
            cep,
            padrao || false,
            clientId,
            addressId
        ]);
        if (!rowCount) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }
        return res.json({ message: 'Endereço atualizado com sucesso.' });
    }
    catch (err) {
        console.error('UPDATE ADDRESS ERROR:', err);
        return res.status(500).json({ error: 'Erro ao atualizar endereço.' });
    }
}
/**
 * DELETE /api/clientes/:clientId/enderecos/:addressId
 */
async function deleteAddress(req, res) {
    const clientId = Number(req.params.clientId);
    const addressId = Number(req.params.addressId);
    try {
        const { rowCount } = await connection_1.pool.query('DELETE FROM enderecos_cliente WHERE id_cliente = $1 AND id = $2', [clientId, addressId]);
        if (!rowCount) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }
        return res.json({ message: 'Endereço removido com sucesso.' });
    }
    catch (err) {
        console.error('DELETE ADDRESS ERROR:', err);
        return res.status(500).json({ error: 'Erro ao remover endereço.' });
    }
}
