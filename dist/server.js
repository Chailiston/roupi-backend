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
// rotas da loja (já existentes)
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const lojaRoutes_1 = __importDefault(require("./routes/lojaRoutes"));
// rotas de produto, imagens e variações
const produtoRoutes_1 = __importDefault(require("./routes/produtoRoutes"));
const produtoImagemRoutes_1 = __importDefault(require("./routes/produtoImagemRoutes"));
const variacoesRoutes_1 = __importDefault(require("./routes/variacoesRoutes"));
// ===== CLIENTE: manter SOMENTE o initial =====
const initialRoutes_1 = __importDefault(require("./routes/cliente/initialRoutes"));
// demais rotas já funcionais (fora do módulo cliente)
const pedidoRoutes_1 = __importDefault(require("./routes/pedidoRoutes"));
const itemPedidoRoutes_1 = __importDefault(require("./routes/itemPedidoRoutes"));
const avaliacaoProdutoRoutes_1 = __importDefault(require("./routes/avaliacaoProdutoRoutes"));
const favoritoRoutes_1 = __importDefault(require("./routes/favoritoRoutes"));
const avaliacaoLojaRoutes_1 = __importDefault(require("./routes/avaliacaoLojaRoutes"));
const notificacaoRoutes_1 = __importDefault(require("./routes/notificacaoRoutes"));
const chamadoRoutes_1 = __importDefault(require("./routes/chamadoRoutes"));
// rotas administrativas
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const relatorioRoutes_1 = __importDefault(require("./routes/relatorioRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const promocoes_1 = __importDefault(require("./routes/promocoes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// 1) CORS e body parser
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 2) Rotas de teste
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'));
app.get('/api/test-db', async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT NOW()');
        res.json(result.rows[0]);
    }
    catch {
        res.status(500).json({ error: 'Erro ao consultar o banco' });
    }
});
app.post('/api/auth/test-body', (req, res) => {
    console.log('BODY RECEBIDO:', req.body);
    res.json({ received: req.body });
});
// 3) Rotas da API
// Autenticação da loja
app.use('/api/auth', authRoutes_1.default);
app.use('/api/lojas', lojaRoutes_1.default);
// ===== CLIENTE: SOMENTE initialRoutes (habilita /initial, /stores, /stores/:id, /produtos, /promocoes) =====
app.use('/api/cliente', initialRoutes_1.default);
// Produtos, imagens e variações da loja
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacoesRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens', produtoImagemRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos', produtoRoutes_1.default);
// demais endpoints da loja
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes_1.default);
// demais rotas genéricas do cliente (fora de /cliente)
app.use('/api/itens-pedido', itemPedidoRoutes_1.default);
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes_1.default);
app.use('/api/favoritos', favoritoRoutes_1.default);
app.use('/api/avaliacoes-loja', avaliacaoLojaRoutes_1.default);
app.use('/api/notificacoes', notificacaoRoutes_1.default);
// Chamados de suporte do cliente
app.use('/api/chamados', chamadoRoutes_1.default);
// rotas administrativas
app.use('/api/admins', adminRoutes_1.default);
app.use('/api/relatorios', relatorioRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/promocoes', promocoes_1.default);
// 4) Uploads estáticos
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
// 404
app.use((_, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno de servidor.' });
});
// 5) Inicia servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
