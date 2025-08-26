// src/server.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { pool } from './database/connection'

// --- ROTAS DA LOJA ---
import authRoutesLoja from './routes/authRoutes' 
import lojaRoutes from './routes/lojaRoutes'
import produtoRoutes from './routes/produtoRoutes'
import produtoImagemRoutes from './routes/produtoImagemRoutes'
import variacaoProdutoRoutes from './routes/variacoesRoutes'
import pedidoRoutes from './routes/pedidoRoutes'
import promocoesRoutes from './routes/promocoes'

// --- ROTAS DO CLIENTE (ORGANIZADAS) ---
import initialRoutes from './routes/cliente/initialRoutes'
import productRoutesCliente from './routes/cliente/productRoutes'
import searchRoutesCliente from './routes/cliente/searchRoutes'
import storeRoutesCliente from './routes/cliente/storeRoutes'
import deliveryRoutesCliente from './routes/cliente/deliveryRoutes'
import authRoutesCliente from './routes/cliente/authRoutes';
import checkoutRoutesCliente from './routes/cliente/checkoutRoutes';
// ✅ 1. IMPORTAÇÃO CORRETA DAS ROTAS DE ENDEREÇO
import addressRoutesCliente from './routes/cliente/addressRoutes'; 

// --- ROTAS GENÉRICAS E ADMIN ---
import itemPedidoRoutes from './routes/itemPedidoRoutes'
import avaliacaoProdutoRoutes from './routes/avaliacaoProdutoRoutes'
import favoritoRoutes from './routes/favoritoRoutes'
import avaliacaoLojaRoutes from './routes/avaliacaoLojaRoutes'
import notificacaoRoutes from './routes/notificacaoRoutes'
import chamadoRoutesCliente from './routes/chamadoRoutes'
import adminRoutes from './routes/adminRoutes'
import relatorioRoutes from './routes/relatorioRoutes'
import uploadRoutes from './routes/uploadRoutes'

dotenv.config()
const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas de teste
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'))
app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao consultar o banco' })
  }
})

// --- REGISTO DAS ROTAS ---

// API da Loja (para o painel do vendedor)
app.use('/api/auth', authRoutesLoja) // Autenticação da Loja
app.use('/api/lojas', lojaRoutes)
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacaoProdutoRoutes)
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens',    produtoImagemRoutes)
app.use('/api/lojas/:lojaId/produtos',                      produtoRoutes)
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes)

// API do Cliente (para o aplicativo)
app.use('/api/cliente', authRoutesCliente); 
app.use('/api/cliente', checkoutRoutesCliente); 
// ✅ 2. REGISTO CORRETO DAS ROTAS DE ENDEREÇO COM O PREFIXO /api/cliente/enderecos
app.use('/api/cliente/enderecos', addressRoutesCliente); 
app.use('/api/cliente/search', searchRoutesCliente) 
app.use('/api/cliente/produtos', productRoutesCliente) 
app.use('/api/cliente/lojas', storeRoutesCliente)
app.use('/api/cliente/delivery', deliveryRoutesCliente)
app.use('/api/cliente', initialRoutes)

// Rotas Genéricas e Admin
app.use('/api/itens-pedido',       itemPedidoRoutes)
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes)
app.use('/api/favoritos',          favoritoRoutes)
app.use('/api/avaliacoes-loja',    avaliacaoLojaRoutes)
app.use('/api/notificacoes',       notificacaoRoutes)
app.use('/api/chamados',           chamadoRoutesCliente)
app.use('/api/admins',             adminRoutes)
app.use('/api/relatorios',         relatorioRoutes)
app.use('/api/upload',             uploadRoutes)
app.use('/api/promocoes',          promocoesRoutes)

// Uploads estáticos e Handlers de Erro
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))
app.use((_, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }))
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno de servidor.' })
})

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})
