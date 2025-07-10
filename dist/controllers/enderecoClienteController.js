"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEndereco = exports.updateEndereco = exports.createEndereco = exports.getEnderecosPorCliente = void 0;
const connection_1 = require("../database/connection");
// Listar endereços de um cliente
const getEnderecosPorCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await connection_1.pool.query('SELECT * FROM enderecos_cliente WHERE cliente_id = $1', [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar endereços' });
    }
};
exports.getEnderecosPorCliente = getEnderecosPorCliente;
// Criar endereço
const createEndereco = async (req, res) => {
    const { cliente_id, rua, numero, bairro, cidade, estado, cep, complemento } = req.body;
    try {
        const result = await connection_1.pool.query(`INSERT INTO enderecos_cliente 
        (cliente_id, rua, numero, bairro, cidade, estado, cep, complemento) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [cliente_id, rua, numero, bairro, cidade, estado, cep, complemento]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar endereço' });
    }
};
exports.createEndereco = createEndereco;
// Atualizar endereço
const updateEndereco = async (req, res) => {
    const { id } = req.params;
    const { rua, numero, bairro, cidade, estado, cep, complemento } = req.body;
    try {
        const result = await connection_1.pool.query(`UPDATE enderecos_cliente 
       SET rua = $1, numero = $2, bairro = $3, cidade = $4, estado = $5, cep = $6, complemento = $7
       WHERE id = $8
       RETURNING *`, [rua, numero, bairro, cidade, estado, cep, complemento, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar endereço' });
    }
};
exports.updateEndereco = updateEndereco;
// Deletar endereço
const deleteEndereco = async (req, res) => {
    const { id } = req.params;
    try {
        await connection_1.pool.query('DELETE FROM enderecos_cliente WHERE id = $1', [id]);
        res.json({ message: 'Endereço deletado com sucesso' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar endereço' });
    }
};
exports.deleteEndereco = deleteEndereco;
