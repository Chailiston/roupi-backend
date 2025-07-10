"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCliente = exports.updateCliente = exports.createCliente = exports.getClienteById = exports.getClientes = void 0;
const connection_1 = require("../database/connection");
// Listar todos os clientes
const getClientes = async (req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM clientes WHERE ativo = true');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
};
exports.getClientes = getClientes;
// Buscar cliente por ID
const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
};
exports.getClienteById = getClienteById;
// Criar novo cliente
const createCliente = async (req, res) => {
    const { nome, email, telefone, cpf } = req.body;
    try {
        const result = await connection_1.pool.query('INSERT INTO clientes (nome, email, telefone, cpf) VALUES ($1, $2, $3, $4) RETURNING *', [nome, email, telefone, cpf]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
};
exports.createCliente = createCliente;
// Atualizar dados do cliente
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, cpf } = req.body;
    try {
        const result = await connection_1.pool.query('UPDATE clientes SET nome = $1, email = $2, telefone = $3, cpf = $4 WHERE id = $5 RETURNING *', [nome, email, telefone, cpf, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
};
exports.updateCliente = updateCliente;
// Desativar cliente (soft delete)
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        await connection_1.pool.query('UPDATE clientes SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'Cliente desativado com sucesso' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao desativar cliente' });
    }
};
exports.deleteCliente = deleteCliente;
