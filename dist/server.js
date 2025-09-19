"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./database/connection");
// --- ARQUIVOS DE ROTAS ---
// Rotas da Loja (Dashboard / App do Lojista)
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const lojaRoutes_1 = __importDefault(require("./routes/lojaRoutes"));
const produtoRoutes_1 = __importDefault(require("./routes/produtoRoutes"));
const produtoImagemRoutes_1 = __importDefault(require("./routes/produtoImagemRoutes"));
const variacoesRoutes_1 = __importDefault(require("./routes/variacoesRoutes"));
const pedidoRoutes_1 = __importDefault(require("./routes/pedidoRoutes"));
const promocoes_1 = __importDefault(require("./routes/promocoes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
// Rotas da API do Cliente
const authRoutes_2 = __importDefault(require("./routes/cliente/authRoutes"));
const initialRoutes_1 = __importDefault(require("./routes/cliente/initialRoutes"));
const productRoutes_1 = __importDefault(require("./routes/cliente/productRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/cliente/searchRoutes"));
const storeRoutes_1 = __importDefault(require("./routes/cliente/storeRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/cliente/deliveryRoutes"));
const checkoutRoutes_1 = __importDefault(require("./routes/cliente/checkoutRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/cliente/addressRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/cliente/orderRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/cliente/profileRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/cliente/favoriteRoutes"));
const chamadoRoutes_1 = __importDefault(require("./routes/chamadoRoutes"));
// ✅ CORREÇÃO: Altera a importação para ser direta (named import).
const pagamentosRoutes_1 = require("./routes/cliente/pagamentosRoutes");
// Rotas de Admin / Relatórios
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const relatorioRoutes_1 = __importDefault(require("./routes/relatorioRoutes"));
// --- CONFIGURAÇÃO INICIAL ---
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// --- MIDDLEWARES GLOBAIS ---
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
// --- ROTAS PÚBLICAS (NÃO EXIGEM AUTENTICAÇÃO) ---
console.log("Registrando rotas públicas...");
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'));
app.get('/api/test-db', async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT NOW()');
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro de conexão com o banco de dados:', error);
        res.status(500).json({ error: 'Erro ao consultar o banco' });
    }
});
// ✅ Rota de Webhook (PÚBLICA) - Usa a rota importada diretamente.
app.use('/api/pagamentos', pagamentosRoutes_1.pagamentosRoutesPublicas);
// --- API PÚBLICA DO CLIENTE ---
app.use('/api/cliente/auth', authRoutes_2.default);
app.use('/api/cliente/initial', initialRoutes_1.default);
app.use('/api/cliente/search', searchRoutes_1.default);
app.use('/api/cliente/produtos', productRoutes_1.default);
app.use('/api/cliente/lojas', storeRoutes_1.default);
app.use('/api/cliente/delivery', deliveryRoutes_1.default);
// --- API PÚBLICA DA LOJA ---
app.use('/api/auth', authRoutes_1.default);
app.use('/api/lojas', lojaRoutes_1.default);
// --- ROTAS PRIVADAS (EXIGEM AUTENTICAÇÃO ESPECÍFICA) ---
console.log("Registrando rotas privadas...");
// --- API PRIVADA DO CLIENTE ---
app.use('/api/cliente/pagamentos', pagamentosRoutes_1.pagamentosRoutesPrivadas); // ✅ Rota de criação de preferência (PRIVADA) - Usa a rota importada diretamente.
app.use('/api/cliente/checkout', checkoutRoutes_1.default);
app.use('/api/cliente/orders', orderRoutes_1.default);
app.use('/api/cliente/profile', profileRoutes_1.default);
app.use('/api/cliente/favoritos', favoriteRoutes_1.default);
app.use('/api/cliente/enderecos', addressRoutes_1.default);
app.use('/api/cliente/chamados', chamadoRoutes_1.default);
// --- API PRIVADA DA LOJA ---
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacoesRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens', produtoImagemRoutes_1.default);
app.use('/api/lojas/:lojaId/produtos', produtoRoutes_1.default);
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes_1.default);
app.use('/api/lojas/:lojaId/promocoes', promocoes_1.default);
// --- ROTAS GENÉRICAS / ADMIN ---
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/admins', adminRoutes_1.default);
app.use('/api/relatorios', relatorioRoutes_1.default);
// --- HANDLERS DE ERRO ---
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});
app.use((err, _req, res, _next) => {
    console.error("ERRO NÃO TRATADO:", err.stack || err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
});
// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor rodando com sucesso em http://localhost:${port}`);
});
