// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './database/connection';

import lojaRoutes from './routes/lojaRoutes'; 
import produtoRoutes from './routes/produtoRoutes';
import variacaoProdutoRoutes from './routes/variacaoProdutoRoutes'; 
import clienteRoutes from './routes/clienteRoutes';
import enderecoClienteRoutes from './routes/enderecoClienteRoutes';
import pedidoRoutes from './routes/pedidoRoutes';
import itemPedidoRoutes from './routes/itemPedidoRoutes';
import avaliacaoProdutoRoutes from './routes/avaliacaoProdutoRoutes';
import favoritoRoutes from './routes/favoritoRoutes';
import avaliacaoLojaRoutes from './routes/avaliacaoLojaRoutes';
import notificacaoRoutes from './routes/notificacaoRoutes';
import chamadoRoutes from './routes/chamadoRoutes';
import adminRoutes from './routes/adminRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 1) Habilita CORS
app.use(cors());

// 2) Parser de JSON e URL-encoded — precisa vir antes das rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3) Rotas de teste
app.get('/', (req, res) => {
  res.send('🚀 Backend ROUPPI rodando com sucesso!');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar o banco' });
  }
});

app.post('/api/auth/test-body', (req, res) => {
  console.log('BODY RECEBIDO:', req.body);
  res.json({ received: req.body });
});

// 4) Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/lojas', lojaRoutes);

// **Nova montagem**: pedidos de uma loja
// vai expor GET /api/lojas/:lojaId/pedidos/:pedidoId
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes);

app.use('/api/produtos', produtoRoutes);
app.use('/api/variacoes', variacaoProdutoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/enderecos', enderecoClienteRoutes);

// **Removido**: não usamos mais app.use('/api/pedidos', pedidoRoutes);
// itemPedido continua independente:
app.use('/api/itens-pedido', itemPedidoRoutes);

app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/avaliacoes-loja', avaliacaoLojaRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/upload', uploadRoutes);

// 5) Servir uploads/imagens
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// 6) Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
