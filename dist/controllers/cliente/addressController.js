"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.setDefaultAddress = exports.createAddress = exports.listAddresses = void 0;
const connection_1 = require("../../database/connection");
const MAX_ADDRESSES_PER_USER = 5;
/**
 * @route GET /api/cliente/enderecos
 * @description Lista apenas os endereços ATIVOS de um cliente.
 */
const listAddresses = async (req, res) => {
    const clienteId = req.user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const query = `
            SELECT * FROM enderecos_cliente 
            WHERE id_cliente = $1 AND ativo = true
            ORDER BY padrao DESC, criado_em DESC
        `;
        const { rows } = await connection_1.pool.query(query, [clienteId]);
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao listar endereços:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listAddresses = listAddresses;
/**
 * @route POST /api/cliente/enderecos
 * @description Cria um novo endereço, respeitando o limite de endereços ATIVOS e evitando duplicados ATIVOS.
 */
const createAddress = async (req, res) => {
    const clienteId = req.user?.id;
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, latitude, longitude } = req.body;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    if (!rua || !bairro || !cidade || !estado || !cep) {
        return res.status(400).json({ message: 'Campos obrigatórios não foram preenchidos.' });
    }
    const client = await connection_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Contar quantos endereços ATIVOS o usuário já possui
        const countResult = await client.query('SELECT COUNT(*) FROM enderecos_cliente WHERE id_cliente = $1 AND ativo = true', [clienteId]);
        const addressCount = parseInt(countResult.rows[0].count, 10);
        if (addressCount >= MAX_ADDRESSES_PER_USER) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Você pode ter no máximo ${MAX_ADDRESSES_PER_USER} endereços cadastrados.` });
        }
        // 2. Verificar se um endereço similar ATIVO já existe
        const similarAddressQuery = `
            SELECT id FROM enderecos_cliente
            WHERE id_cliente = $1 AND lower(rua) = lower($2) AND lower(numero) = lower($3) AND cep = $4 AND ativo = true
        `;
        const similarResult = await client.query(similarAddressQuery, [clienteId, rua, numero || '', cep]);
        if (similarResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Este endereço já está cadastrado.' });
        }
        // 3. Inserir o novo endereço (será 'ativo' por padrão)
        const insertQuery = `
            INSERT INTO enderecos_cliente 
            (id_cliente, apelido, rua, numero, complemento, bairro, cidade, estado, cep, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *
        `;
        const values = [clienteId, apelido, rua, numero || null, complemento, bairro, cidade, estado, cep, latitude, longitude];
        const { rows } = await client.query(insertQuery, values);
        await client.query('COMMIT');
        return res.status(201).json(rows[0]);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar endereço:', error);
        return res.status(500).json({ message: 'Erro interno do servidor ao salvar o endereço.' });
    }
    finally {
        client.release();
    }
};
exports.createAddress = createAddress;
/**
 * @route PATCH /api/cliente/enderecos/:id/set-default
 * @description Define um endereço ATIVO como o padrão.
 */
const setDefaultAddress = async (req, res) => {
    const clienteId = req.user?.id;
    const { id: addressId } = req.params;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    if (!addressId) {
        return res.status(400).json({ message: 'O ID do endereço é obrigatório.' });
    }
    const client = await connection_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Primeiro, remove o status de padrão de qualquer outro endereço do cliente
        const resetDefaultQuery = 'UPDATE enderecos_cliente SET padrao = false WHERE id_cliente = $1';
        await client.query(resetDefaultQuery, [clienteId]);
        // Depois, define o novo endereço como padrão, garantindo que ele está ativo e pertence ao usuário
        const setDefaultQuery = 'UPDATE enderecos_cliente SET padrao = true WHERE id = $1 AND id_cliente = $2 AND ativo = true RETURNING *';
        const result = await client.query(setDefaultQuery, [addressId, clienteId]);
        // ✅ MELHORIA: Se nenhum registro foi atualizado, é porque o endereço não foi encontrado ou está inativo.
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Endereço não encontrado, inativo, ou não pertence a este usuário.' });
        }
        await client.query('COMMIT');
        return res.status(200).json({ message: 'Endereço padrão atualizado com sucesso.', address: result.rows[0] });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao definir endereço padrão:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    finally {
        client.release();
    }
};
exports.setDefaultAddress = setDefaultAddress;
/**
 * @route DELETE /api/cliente/enderecos/:id
 * @description Desativa um endereço (soft delete), impedindo a remoção do endereço padrão.
 */
const deleteAddress = async (req, res) => {
    const clienteId = req.user?.id;
    const { id: addressId } = req.params;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    const client = await connection_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Verifica se o endereço a ser removido existe e se é o padrão
        const checkAddressQuery = 'SELECT padrao FROM enderecos_cliente WHERE id = $1 AND id_cliente = $2 AND ativo = true';
        const checkResult = await client.query(checkAddressQuery, [addressId, clienteId]);
        // ✅ MELHORIA: Se não encontrar o endereço, retorna 404.
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Endereço não encontrado ou já está inativo.' });
        }
        if (checkResult.rows[0].padrao) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Você não pode remover seu endereço padrão. Defina outro como padrão primeiro.' });
        }
        // Desativa o endereço
        const updateQuery = 'UPDATE enderecos_cliente SET ativo = false, padrao = false WHERE id = $1 AND id_cliente = $2';
        await client.query(updateQuery, [addressId, clienteId]);
        await client.query('COMMIT');
        return res.status(200).json({ message: 'Endereço removido com sucesso.' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao remover endereço:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    finally {
        client.release();
    }
};
exports.deleteAddress = deleteAddress;
