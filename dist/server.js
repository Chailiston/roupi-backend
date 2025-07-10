"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./database/connection");
const lojaRoutes_1 = __importDefault(require("./routes/lojaRoutes"));
const produtoRoutes_1 = __importDefault(require("./routes/produtoRoutes"));
const variacaoProdutoRoutes_1 = __importDefault(require("./routes/variacaoProdutoRoutes"));
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const enderecoClienteRoutes_1 = __importDefault(require("./routes/enderecoClienteRoutes"));
const pedidoRoutes_1 = __importDefault(require("./routes/pedidoRoutes"));
const itemPedidoRoutes_1 = __importDefault(require("./routes/itemPedidoRoutes"));
const avaliacaoProdutoRoutes_1 = __importDefault(require("./routes/avaliacaoProdutoRoutes"));
const favoritoRoutes_1 = __importDefault(require("./routes/favoritoRoutes"));
const avaliacaoLojaRoutes_1 = __importDefault(require("./routes/avaliacaoLojaRoutes"));
const notificacaoRoutes_1 = __importDefault(require("./routes/notificacaoRoutes"));
const chamadoRoutes_1 = __importDefault(require("./routes/chamadoRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const relatorioRoutes_1 = __importDefault(require("./routes/relatorioRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// 1) Habilita CORS
app.use((0, cors_1.default)());
// 2) Parser de JSON e URL-encoded (body) — precisa vir antes das rotas
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 3) Rotas de teste
app.get('/', (req, res) => {
    res.send('🚀 Backend ROUPPI rodando com sucesso!');
});
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT NOW()');
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao consultar o banco' });
    }
});
// 4) Rotas da API
app.post('/api/auth/echo', (req, res) => {
    console.log('BODY ECHO:', req.body);
    res.json({ youSent: req.body });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/lojas', lojaRoutes_1.default);
app.use('/api/produtos', produtoRoutes_1.default);
app.use('/api/variacoes', variacaoProdutoRoutes_1.default);
app.use('/api/clientes', clienteRoutes_1.default);
app.use('/api/enderecos', enderecoClienteRoutes_1.default);
app.use('/api/pedidos', pedidoRoutes_1.default);
app.use('/api/itens-pedido', itemPedidoRoutes_1.default);
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes_1.default);
app.use('/api/favoritos', favoritoRoutes_1.default);
app.use('/api/avaliacoes-loja', avaliacaoLojaRoutes_1.default);
app.use('/api/notificacoes', notificacaoRoutes_1.default);
app.use('/api/chamados', chamadoRoutes_1.default);
app.use('/api/admins', adminRoutes_1.default);
app.use('/api/relatorios', relatorioRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
// 5) Servir uploads/imagens
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
// 6) Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
