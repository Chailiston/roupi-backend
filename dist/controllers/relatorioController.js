"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesAtivos = exports.faturamentoMensal = exports.produtosMaisVendidos = exports.vendasPorLoja = void 0;
const connection_1 = require("../database/connection");
// Vendas por loja
const vendasPorLoja = async (_req, res) => {
    const result = await connection_1.pool.query('SELECT * FROM view_vendas_por_loja');
    res.json(result.rows);
};
exports.vendasPorLoja = vendasPorLoja;
// Produtos mais vendidos
const produtosMaisVendidos = async (_req, res) => {
    const result = await connection_1.pool.query('SELECT * FROM view_produtos_mais_vendidos');
    res.json(result.rows);
};
exports.produtosMaisVendidos = produtosMaisVendidos;
// Faturamento por mês
const faturamentoMensal = async (_req, res) => {
    const result = await connection_1.pool.query('SELECT * FROM view_faturamento_por_mes');
    res.json(result.rows);
};
exports.faturamentoMensal = faturamentoMensal;
// Clientes mais ativos
const clientesAtivos = async (_req, res) => {
    const result = await connection_1.pool.query('SELECT * FROM view_clientes_ativos');
    res.json(result.rows);
};
exports.clientesAtivos = clientesAtivos;
