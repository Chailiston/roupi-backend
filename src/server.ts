// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './database/connection';

// rotas da loja (já existentes)
import authRoutes            from './routes/authRoutes';
import lojaRoutes            from './routes/lojaRoutes';

// rotas de produto e imagens
import produtoRoutes         from './routes/produtoRoutes';
import produtoImagemRoutes   from './routes/produtoImagemRoutes';
import variacaoProdutoRoutes from './routes/variacaoProdutoRoutes';

// rotas do cliente
import clientAuthRoutes      from './routes/clientAuthRoutes';
import clientProfileRoutes   from './routes/clientProfileRoutes';
import clienteRoutes         from './routes/clienteRoutes';
import enderecoClienteRoutes from './routes/clientAddressRoutes';
import pedidoRoutes          from './routes/pedidoRoutes';
import itemPedidoRoutes      from './routes/itemPedidoRoutes';
import avaliacaoProdutoRoutes from './routes/avaliacaoProdutoRoutes';
import favoritoRoutes        from './routes/favoritoRoutes';
import avaliacaoLojaRoutes   from './routes/avaliacaoLojaRoutes';
import notificacaoRoutes     from './routes/notificacaoRoutes';
import chamadoRoutes         from './routes/chamadoRoutes';

// rotas administrativas (já existentes)
import adminRoutes        from './routes/adminRoutes';
import relatorioRoutes    from './routes/relatorioRoutes';
import uploadRoutes       from './routes/uploadRoutes';
import promocoesRoutes    from './routes/promocoes';

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// 1) CORS e body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Rotas de teste
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'));
app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao consultar o banco' });
  }
});
app.post('/api/auth/test-body', (req, res) => {
  console.log('BODY RECEBIDO:', req.body);
  res.json({ received: req.body });
});

// 3) Rotas da API

// Autenticação da loja
app.use('/api/auth', authRoutes);
app.use('/api/lojas', lojaRoutes);

// Produtos, imagens e variações da loja
app.use('/api/lojas/:lojaId/produtos', produtoRoutes);
app.use('/api/lojas/:lojaId/produtos', produtoImagemRoutes);
app.use(
  '/api/lojas/:lojaId/produtos/:produtoId/variacoes',
  variacaoProdutoRoutes
);

// Autenticação do cliente
app.use('/api/cliente/auth', clientAuthRoutes);
app.use('/api/cliente/profile', clientProfileRoutes);

// Rotas específicas de endereços DEPOIS do profile, ANTES do cliente genérico
app.use('/api/clientes/:clientId/enderecos', enderecoClienteRoutes);

// Rotas genéricas de cliente
app.use('/api/clientes', clienteRoutes);

// demais endpoints da loja
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes);

// demais rotas genéricas do cliente
app.use('/api/itens-pedido', itemPedidoRoutes);
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/avaliacoes-loja', avaliacaoLojaRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/chamados', chamadoRoutes);

// rotas administrativas
app.use('/api/admins', adminRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promocoes', promocoesRoutes);

// 4) Uploads estáticos
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '..', 'uploads'))
);

// Catch-all de rota não encontrada
app.use((_, res) =>
  res.status(404).json({ error: 'Endpoint não encontrado.' })
);

// Error handler
app.use(
  (err: any, _: express.Request, res: express.Response, __: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno de servidor.' });
  }
);

// 5) Inicia servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
