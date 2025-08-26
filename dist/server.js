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
// --- ROTAS DA LOJA ---
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const lojaRoutes_1 = __importDefault(require("./routes/lojaRoutes"));
const produtoRoutes_1 = __importDefault(require("./routes/produtoRoutes"));
const produtoImagemRoutes_1 = __importDefault(require("./routes/produtoImagemRoutes"));
const variacoesRoutes_1 = __importDefault(require("./routes/variacoesRoutes"));
const pedidoRoutes_1 = __importDefault(require("./routes/pedidoRoutes"));
const promocoes_1 = __importDefault(require("./routes/promocoes"));
// --- ROTAS DO CLIENTE (ORGANIZADAS) ---
const initialRoutes_1 = __importDefault(require("./routes/cliente/initialRoutes"));
const productRoutes_1 = __importDefault(require("./routes/cliente/productRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/cliente/searchRoutes"));
const storeRoutes_1 = __importDefault(require("./routes/cliente/storeRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/cliente/deliveryRoutes"));
const authRoutes_2 = __importDefault(require("./routes/cliente/authRoutes"));
const checkoutRoutes_1 = __importDefault(require("./routes/cliente/checkoutRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/cliente/addressRoutes")); // ✅ 1. IMPORTA AS ROTAS DE ENDEREÇO
// --- ROTAS GENÉRICAS E ADMIN ---
const itemPedidoRoutes_1 = __importDefault(require("./routes/itemPedidoRoutes"));
const avaliacaoProdutoRoutes_1 = __importDefault(require("./routes/avaliacaoProdutoRoutes"));
const favoritoRoutes_1 = __importDefault(require("./routes/favoritoRoutes"));
const avaliacaoLojaRoutes_1 = __importDefault(require("./routes/avaliacaoLojaRoutes"));
const notificacaoRoutes_1 = __importDefault(require("./routes/notificacaoRoutes"));
const chamadoRoutes_1 = __importDefault(require("./routes/chamadoRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const relatorioRoutes_1 = __importDefault(require("./routes/relatorioRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rotas de teste
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
// --- REGISTO DAS ROTAS ---
// API da Loja (para o painel do vendedor)
app.use('/api/auth', authRoutes_1.default); // Autenticação da Loja
app.use('/api/lojas', lojaRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacoesRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens', produtoImagemRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos', produtoRoutes_1.default);
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes_1.default);
// API do Cliente (para o aplicativo)
app.use('/api/cliente', authRoutes_2.default);
app.use('/api/cliente', checkoutRoutes_1.default);
app.use('/api/cliente/enderecos', addressRoutes_1.default); // ✅ 2. REGISTA AS ROTAS DE ENDEREÇO
app.use('/api/cliente/search', searchRoutes_1.default);
app.use('/api/cliente/produtos', productRoutes_1.default);
app.use('/api/cliente/lojas', storeRoutes_1.default);
app.use('/api/cliente/delivery', deliveryRoutes_1.default);
app.use('/api/cliente', initialRoutes_1.default);
// Rotas Genéricas e Admin
app.use('/api/itens-pedido', itemPedidoRoutes_1.default);
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes_1.default);
app.use('/api/favoritos', favoritoRoutes_1.default);
app.use('/api/avaliacoes-loja', avaliacaoLojaRoutes_1.default);
app.use('/api/notificacoes', notificacaoRoutes_1.default);
app.use('/api/chamados', chamadoRoutes_1.default);
app.use('/api/admins', adminRoutes_1.default);
app.use('/api/relatorios', relatorioRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/promocoes', promocoes_1.default);
// Uploads estáticos e Handlers de Erro
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
app.use((_, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno de servidor.' });
});
// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
