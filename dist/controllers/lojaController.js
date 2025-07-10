"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPainelLoja = exports.getDadosBancarios = exports.updateLoja = exports.createLoja = exports.getLojaById = exports.getLojas = void 0;
const connection_1 = require("../database/connection");
// GET /api/lojas
const getLojas = async (req, res) => {
    try {
        const { rows } = await connection_1.pool.query('SELECT * FROM lojas');
        return res.json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar lojas:', error);
        return res.status(500).json({ error: 'Erro ao buscar lojas' });
    }
};
exports.getLojas = getLojas;
// GET /api/lojas/:id
const getLojaById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await connection_1.pool.query('SELECT * FROM lojas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }
        return res.json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar loja por ID:', error);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
exports.getLojaById = getLojaById;
// POST /api/lojas
const createLoja = async (req, res) => {
    const { nome, cnpj, email, telefone, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, horario_funcionamento, banco, agencia, conta, tipo_conta } = req.body;
    try {
        const lojaResult = await connection_1.pool.query(`INSERT INTO lojas (
         nome, cnpj, email, telefone,
         endereco_rua, endereco_numero, endereco_bairro,
         endereco_cidade, endereco_estado, endereco_cep,
         horario_funcionamento
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
       ) RETURNING *`, [
            nome, cnpj, email, telefone,
            endereco_rua, endereco_numero, endereco_bairro,
            endereco_cidade, endereco_estado, endereco_cep,
            horario_funcionamento
        ]);
        const loja = lojaResult.rows[0];
        await connection_1.pool.query(`INSERT INTO dados_bancarios_loja (
         id_loja, banco, agencia, conta, tipo_conta
       ) VALUES ($1,$2,$3,$4,$5)`, [loja.id, banco, agencia, conta, tipo_conta]);
        return res.status(201).json({ message: 'Loja criada com sucesso', loja });
    }
    catch (error) {
        console.error('Erro ao criar loja:', error);
        return res.status(500).json({ error: 'Erro ao criar loja' });
    }
};
exports.createLoja = createLoja;
// PUT /api/lojas/:id
const updateLoja = async (req, res) => {
    const { id } = req.params;
    const { nome, cnpj, email, telefone, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, horario_funcionamento, banco, agencia, conta, tipo_conta } = req.body;
    try {
        await connection_1.pool.query(`UPDATE lojas SET
         nome=$1, cnpj=$2, email=$3, telefone=$4,
         endereco_rua=$5, endereco_numero=$6, endereco_bairro=$7,
         endereco_cidade=$8, endereco_estado=$9, endereco_cep=$10,
         horario_funcionamento=$11
       WHERE id=$12`, [
            nome, cnpj, email, telefone,
            endereco_rua, endereco_numero, endereco_bairro,
            endereco_cidade, endereco_estado, endereco_cep,
            horario_funcionamento, id
        ]);
        const banc = await connection_1.pool.query('SELECT id FROM dados_bancarios_loja WHERE id_loja=$1', [id]);
        if (banc.rowCount) {
            await connection_1.pool.query(`UPDATE dados_bancarios_loja SET
           banco=$1, agencia=$2, conta=$3, tipo_conta=$4
         WHERE id_loja=$5`, [banco, agencia, conta, tipo_conta, id]);
        }
        else {
            await connection_1.pool.query(`INSERT INTO dados_bancarios_loja (
           id_loja, banco, agencia, conta, tipo_conta
         ) VALUES ($1,$2,$3,$4,$5)`, [id, banco, agencia, conta, tipo_conta]);
        }
        return res.json({ message: 'Loja e dados bancários atualizados com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar loja:', error);
        return res.status(500).json({ error: 'Erro ao atualizar loja' });
    }
};
exports.updateLoja = updateLoja;
// GET /api/lojas/:id/dados-bancarios
const getDadosBancarios = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await connection_1.pool.query('SELECT * FROM dados_bancarios_loja WHERE id_loja=$1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Dados bancários não encontrados' });
        }
        return res.json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar dados bancários:', error);
        return res.status(500).json({ error: 'Erro ao buscar dados bancários' });
    }
};
exports.getDadosBancarios = getDadosBancarios;
// GET /api/lojas/:id/painel
const getPainelLoja = async (req, res) => {
    try {
        const { id } = req.params;
        const lojaRes = await connection_1.pool.query('SELECT id, nome FROM lojas WHERE id=$1', [id]);
        if (lojaRes.rowCount === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }
        const loja = lojaRes.rows[0];
        const ped = await connection_1.pool.query('SELECT COUNT(*) FROM pedidos WHERE id_loja=$1', [id]);
        const totalPedidos = parseInt(ped.rows[0].count, 10);
        const av = await connection_1.pool.query('SELECT ROUND(AVG(nota)::numeric,2) AS media FROM avaliacoes_loja WHERE id_loja=$1', [id]);
        const mediaAvaliacao = parseFloat(av.rows[0].media) || 0;
        const prod = await connection_1.pool.query('SELECT COUNT(*) FROM produtos WHERE id_loja=$1', [id]);
        const totalProdutos = parseInt(prod.rows[0].count, 10);
        const ult = await connection_1.pool.query(`SELECT id, valor_total, criado_em
       FROM pedidos
       WHERE id_loja=$1
       ORDER BY criado_em DESC
       LIMIT 5`, [id]);
        return res.json({
            loja,
            totalPedidos,
            mediaAvaliacao,
            totalProdutos,
            ultimosPedidos: ult.rows
        });
    }
    catch (error) {
        console.error('Erro ao carregar painel da loja:', error);
        return res.status(500).json({ error: 'Erro ao carregar painel' });
    }
};
exports.getPainelLoja = getPainelLoja;
