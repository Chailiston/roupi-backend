// src/server.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { pool } from './database/connection'

// rotas da loja (já existentes)
import authRoutes            from './routes/authRoutes'
import lojaRoutes            from './routes/lojaRoutes'

// rotas de produto, imagens e variações
import produtoRoutes         from './routes/produtoRoutes'
import produtoImagemRoutes   from './routes/produtoImagemRoutes'
import variacaoProdutoRoutes from './routes/variacoesRoutes'

// ===== CLIENTE: manter SOMENTE o initial =====
import initialRoutes         from './routes/cliente/initialRoutes'

// demais rotas já funcionais (fora do módulo cliente)
import pedidoRoutes           from './routes/pedidoRoutes'
import itemPedidoRoutes       from './routes/itemPedidoRoutes'
import avaliacaoProdutoRoutes from './routes/avaliacaoProdutoRoutes'
import favoritoRoutes         from './routes/favoritoRoutes'
import avaliacaoLojaRoutes    from './routes/avaliacaoLojaRoutes'
import notificacaoRoutes      from './routes/notificacaoRoutes'
import chamadoRoutesCliente   from './routes/chamadoRoutes'

// rotas administrativas
import adminRoutes      from './routes/adminRoutes'
import relatorioRoutes  from './routes/relatorioRoutes'
import uploadRoutes     from './routes/uploadRoutes'
import promocoesRoutes  from './routes/promocoes'

dotenv.config()
const app = express()
const port = process.env.PORT || 3001

// 1) CORS e body parser
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 2) Rotas de teste
app.get('/', (_req, res) => res.send('🚀 Backend ROUPPI rodando com sucesso!'))
app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao consultar o banco' })
  }
})
app.post('/api/auth/test-body', (req, res) => {
  console.log('BODY RECEBIDO:', req.body)
  res.json({ received: req.body })
})

// 3) Rotas da API

// Autenticação da loja
app.use('/api/auth', authRoutes)
app.use('/api/lojas', lojaRoutes)

// ===== CLIENTE: SOMENTE initialRoutes (habilita /initial, /stores, /stores/:id, /produtos, /promocoes) =====
app.use('/api/cliente', initialRoutes)

// Produtos, imagens e variações da loja
app.use('/api/lojas/:lojaId/produtos/:produtoId/variacoes', variacaoProdutoRoutes)
app.use('/api/lojas/:lojaId/produtos/:produtoId/imagens',   produtoImagemRoutes)
app.use('/api/lojas/:lojaId/produtos',                      produtoRoutes)

// demais endpoints da loja
app.use('/api/lojas/:lojaId/pedidos', pedidoRoutes)

// demais rotas genéricas do cliente (fora de /cliente)
app.use('/api/itens-pedido',       itemPedidoRoutes)
app.use('/api/avaliacoes-produto', avaliacaoProdutoRoutes)
app.use('/api/favoritos',          favoritoRoutes)
app.use('/api/avaliacoes-loja',    avaliacaoLojaRoutes)
app.use('/api/notificacoes',       notificacaoRoutes)

// Chamados de suporte do cliente
app.use('/api/chamados', chamadoRoutesCliente)

// rotas administrativas
app.use('/api/admins',     adminRoutes)
app.use('/api/relatorios', relatorioRoutes)
app.use('/api/upload',     uploadRoutes)
app.use('/api/promocoes',  promocoesRoutes)

// 4) Uploads estáticos
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

// 404
app.use((_, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }))

// Error handler
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Erro interno de servidor.' })
  }
)

// 5) Inicia servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})
