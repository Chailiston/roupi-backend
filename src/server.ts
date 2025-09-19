import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './database/connection';

// --- ARQUIVOS DE ROTAS ---

// Rotas da Loja (Dashboard / App do Lojista)
import authRoutesLoja from './routes/authRoutes';
import lojaRoutes from './routes/lojaRoutes';
import produtoRoutes from './routes/produtoRoutes';
import produtoImagemRoutes from './routes/produtoImagemRoutes';
import variacaoProdutoRoutes from './routes/variacoesRoutes';
import pedidoRoutes from './routes/pedidoRoutes';
import promocoesRoutes from './routes/promocoes';
import uploadRoutes from './routes/uploadRoutes'; // Upload é mais genérico, mas usado pelo lojista

// Rotas da API do Cliente
import authRoutesCliente from './routes/cliente/authRoutes';
import initialRoutesCliente from './routes/cliente/initialRoutes';
import productRoutesCliente from './routes/cliente/productRoutes';
import searchRoutesCliente from './routes/cliente/searchRoutes';
import storeRoutesCliente from './routes/cliente/storeRoutes';
import deliveryRoutesCliente from './routes/cliente/deliveryRoutes';
import checkoutRoutesCliente from './routes/cliente/checkoutRoutes';
import addressRoutesCliente from './routes/cliente/addressRoutes';
import orderRoutesCliente from './routes/cliente/orderRoutes';
import profileRoutesCliente from './routes/cliente/profileRoutes';
import favoriteRoutesCliente from './routes/cliente/favoriteRoutes';
import chamadoRoutesCliente from './routes/chamadoRoutes';

// Rotas de Admin / Relatórios
import adminRoutes from './routes/adminRoutes';
import relatorioRoutes from './routes/relatorioRoutes';

// --- CONFIGURAÇÃO INICIAL ---
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARES GLOBAIS ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// --- ROTAS PÚBLICAS (NÃO EXIGEM AUTENTICAÇÃO) ---
console.log("Registrando rotas públicas...");
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'));
app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro de conexão com o banco de dados:', error);
    res.status(500).json({ error: 'Erro ao consultar o banco' });
  }
});

// --- API PÚBLICA DO CLIENTE ---
app.use('/api/cliente/auth', authRoutesCliente);
app.use('/api/cliente/initial', initialRoutesCliente);
app.use('/api/cliente/search', searchRoutesCliente);
app.use('/api/cliente/produtos', productRoutesCliente);
app.use('/api/cliente/lojas', storeRoutesCliente);
app.use('/api/cliente/delivery', deliveryRoutesCliente);

// --- API PÚBLICA DA LOJA ---
app.use('/api/auth', authRoutesLoja); // Login do lojista
app.use('/api/lojas', lojaRoutes); // Detalhes públicos da loja

// --- ROTAS PRIVADAS (EXIGEM AUTENTICAÇÃO ESPECÍFICA) ---
// O middleware de autenticação agora é aplicado diretamente dentro de cada arquivo de rota,
// tornando o sistema mais modular e claro.

console.log("Registrando rotas privadas...");

// --- API PRIVADA DO CLIENTE ---
app.use('/api/cliente/checkout', checkoutRoutesCliente);
app.use('/api/cliente/orders', orderRoutesCliente);
app.use('/api/cliente/profile', profileRoutesCliente);
app.use('/api/cliente/favoritos', favoriteRoutesCliente);
app.use('/api/cliente/enderecos', addressRoutesCliente);
app.use('/api/cliente/chamados', chamadoRoutesCliente);

// --- API PRIVADA DA LOJA ---
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacaoProdutoRoutes);
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens', produtoImagemRoutes);
app.use('/api/lojas/:lojaId/produtos', produtoRoutes);
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes);
app.use('/api/lojas/:lojaId/promocoes', promocoesRoutes); // Assumindo que gerenciar promoções é privado

// --- ROTAS GENÉRICAS / ADMIN ---
app.use('/api/upload', uploadRoutes); // Pode precisar de auth de lojista
app.use('/api/admins', adminRoutes); // Precisa de auth de admin
app.use('/api/relatorios', relatorioRoutes); // Precisa de auth de admin

// --- HANDLERS DE ERRO (DEVEM SER OS ÚLTIMOS) ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("ERRO NÃO TRATADO:", err.stack || err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor rodando com sucesso em http://localhost:${port}`);
});
