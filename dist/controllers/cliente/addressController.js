"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.createAddress = exports.listAddresses = void 0;
const connection_1 = require("../../database/connection");
/**
 * @route GET /api/cliente/enderecos
 * @description Lista todos os endereços de um cliente logado.
 * O endereço padrão é sempre listado primeiro.
 */
const listAddresses = async (req, res) => {
    const clienteId = req.user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado. ID do cliente não encontrado.' });
    }
    try {
        const query = `
            SELECT * FROM enderecos_cliente 
            WHERE id_cliente = $1 
            ORDER BY padrao DESC, criado_em DESC
        `;
        const { rows } = await connection_1.pool.query(query, [clienteId]);
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao listar endereços:', error);
        return res.status(500).json({ message: 'Erro interno do servidor ao buscar endereços.' });
    }
};
exports.listAddresses = listAddresses;
/**
 * @route POST /api/cliente/enderecos
 * @description Cria um novo endereço para o cliente logado.
 */
const createAddress = async (req, res) => {
    const clienteId = req.user?.id;
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, latitude, longitude } = req.body;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado. ID do cliente não encontrado.' });
    }
    if (!rua || !bairro || !cidade || !estado || !cep) {
        return res.status(400).json({ message: 'Campos obrigatórios (rua, bairro, cidade, estado, cep) não foram preenchidos.' });
    }
    try {
        const query = `
            INSERT INTO enderecos_cliente 
            (id_cliente, apelido, rua, numero, complemento, bairro, cidade, estado, cep, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *
        `;
        const values = [clienteId, apelido, rua, numero, complemento, bairro, cidade, estado, cep, latitude, longitude];
        const { rows } = await connection_1.pool.query(query, values);
        return res.status(201).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao criar endereço:', error);
        return res.status(500).json({ message: 'Erro interno do servidor ao salvar o endereço.' });
    }
};
exports.createAddress = createAddress;
/**
 * @route PATCH /api/cliente/enderecos/:id/set-default
 * @description Define um endereço como o padrão para o cliente logado.
 * Garante que apenas um endereço pode ser o padrão por vez.
 */
const setDefaultAddress = async (req, res) => {
    const clienteId = req.user?.id;
    const { id: addressId } = req.params;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado. ID do cliente não encontrado.' });
    }
    if (!addressId) {
        return res.status(400).json({ message: 'O ID do endereço é obrigatório.' });
    }
    const client = await connection_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Primeiro, remove a marcação de 'padrão' de todos os outros endereços do cliente
        const resetDefaultQuery = 'UPDATE enderecos_cliente SET padrao = false WHERE id_cliente = $1';
        await client.query(resetDefaultQuery, [clienteId]);
        // Em seguida, define o endereço escolhido como 'padrão'
        const setDefaultQuery = 'UPDATE enderecos_cliente SET padrao = true WHERE id = $1 AND id_cliente = $2 RETURNING *';
        const result = await client.query(setDefaultQuery, [addressId, clienteId]);
        if (result.rows.length === 0) {
            throw new Error('Endereço não encontrado ou não pertence a este usuário.');
        }
        await client.query('COMMIT');
        return res.status(200).json({ message: 'Endereço padrão atualizado com sucesso.', address: result.rows[0] });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao definir endereço padrão:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Erro interno do servidor.';
        return res.status(500).json({ message: errorMessage });
    }
    finally {
        client.release();
    }
};
exports.setDefaultAddress = setDefaultAddress;
