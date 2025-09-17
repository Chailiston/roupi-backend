"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePromocao = exports.toggleAtivo = exports.updatePromocao = exports.createPromocao = exports.getPromocaoById = exports.getPromocoes = void 0;
const connection_1 = require("../database/connection");
// GET /api/promocoes
const getPromocoes = async (_req, res) => {
    try {
        const { rows } = await connection_1.pool.query('SELECT id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em FROM promocoes ORDER BY id');
        res.json(rows);
    }
    catch (err) {
        console.error('Erro ao listar promoções:', err);
        res.status(500).json({ error: 'Erro interno ao listar promoções' });
    }
};
exports.getPromocoes = getPromocoes;
// GET /api/promocoes/:id
const getPromocaoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await connection_1.pool.query('SELECT id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em FROM promocoes WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Promoção não encontrada' });
        }
        const promo = result.rows[0];
        const produtosQ = await connection_1.pool.query('SELECT id_produto FROM promocao_produtos WHERE id_promocao = $1', [id]);
        promo.produtos = produtosQ.rows.map(r => r.id_produto);
        res.json(promo);
    }
    catch (err) {
        console.error('Erro ao buscar promoção:', err);
        res.status(500).json({ error: 'Erro interno ao buscar promoção' });
    }
};
exports.getPromocaoById = getPromocaoById;
// POST /api/promocoes
const createPromocao = async (req, res) => {
    try {
        const { tipo, valor = null, data_inicio, data_fim, estoque_maximo = null, ativo = true, produtos = [] } = req.body;
        const result = await connection_1.pool.query(`INSERT INTO promocoes
         (tipo, valor, data_inicio, data_fim, estoque_maximo, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em`, [tipo, valor, data_inicio, data_fim, estoque_maximo, ativo]);
        const promo = result.rows[0];
        for (const pid of produtos) {
            await connection_1.pool.query('INSERT INTO promocao_produtos (id_promocao, id_produto) VALUES ($1, $2)', [promo.id, pid]);
        }
        res.status(201).json(promo);
    }
    catch (err) {
        console.error('Erro ao criar promoção:', err);
        res.status(500).json({ error: 'Erro interno ao criar promoção' });
    }
};
exports.createPromocao = createPromocao;
// PUT /api/promocoes/:id
const updatePromocao = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { tipo, valor = null, data_inicio, data_fim, estoque_maximo = null, ativo = true, produtos = [] } = req.body;
        const result = await connection_1.pool.query(`UPDATE promocoes SET
         tipo = $1,
         valor = $2,
         data_inicio = $3,
         data_fim = $4,
         estoque_maximo = $5,
         ativo = $6,
         atualizado_em = NOW()
       WHERE id = $7
       RETURNING id, tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, criado_em, atualizado_em`, [tipo, valor, data_inicio, data_fim, estoque_maximo, ativo, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Promoção não encontrada' });
        }
        // Sincroniza produtos
        await connection_1.pool.query('DELETE FROM promocao_produtos WHERE id_promocao = $1', [id]);
        for (const pid of produtos) {
            await connection_1.pool.query('INSERT INTO promocao_produtos (id_promocao, id_produto) VALUES ($1, $2)', [id, pid]);
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Erro ao atualizar promoção:', err);
        res.status(500).json({ error: 'Erro interno ao atualizar promoção' });
    }
};
exports.updatePromocao = updatePromocao;
// PATCH /api/promocoes/:id/ativo
const toggleAtivo = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { ativo } = req.body;
        const result = await connection_1.pool.query(`UPDATE promocoes
         SET ativo = $1, atualizado_em = NOW()
       WHERE id = $2`, [ativo, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Promoção não encontrada' });
        }
        res.sendStatus(204);
    }
    catch (err) {
        console.error('Erro ao toggle de ativo:', err);
        res.status(500).json({ error: 'Erro interno ao atualizar status' });
    }
};
exports.toggleAtivo = toggleAtivo;
// DELETE /api/promocoes/:id
const deletePromocao = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await connection_1.pool.query('DELETE FROM promocoes WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Promoção não encontrada' });
        }
        await connection_1.pool.query('DELETE FROM promocao_produtos WHERE id_promocao = $1', [id]);
        res.sendStatus(204);
    }
    catch (err) {
        console.error('Erro ao excluir promoção:', err);
        res.status(500).json({ error: 'Erro interno ao excluir promoção' });
    }
};
exports.deletePromocao = deletePromocao;
