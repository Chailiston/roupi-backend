// src/controllers/pedidoController.ts

import { Request, Response } from 'express'
import { pool } from '../database/connection'

// GET /api/lojas/:lojaId/pedidos
export const getPedidosByLoja = async (req: Request, res: Response) => {
  try {
    const { lojaId } = req.params
    const result = await pool.query(
      `SELECT 
         id,
         id_cliente,
         status,
         forma_pagamento,
         valor_total,
         observacoes,
         criado_em
       FROM pedidos
       WHERE id_loja = $1
       ORDER BY criado_em DESC`,
      [lojaId]
    )
    return res.json(result.rows)
  } catch (err: any) {
    console.error('Erro ao buscar pedidos da loja:', err)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// GET /api/lojas/:lojaId/pedidos/:pedidoId
export const getPedidoById = async (req: Request, res: Response) => {
  try {
    const { lojaId, pedidoId } = req.params

    // 1) busca os dados principais do pedido, incluindo referência ao endereço de entrega
    const pedidoRes = await pool.query(
      `SELECT 
         id,
         id_cliente,
         status,
         forma_pagamento,
         valor_total,
         observacoes,
         criado_em,
         id_endereco_entrega
       FROM pedidos
       WHERE id_loja = $1
         AND id = $2`,
      [lojaId, pedidoId]
    )
    if (pedidoRes.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }
    const pedido = pedidoRes.rows[0]

    // 2) busca os itens do pedido
    const itensRes = await pool.query(
      `SELECT 
         id,
         nome_produto,
         quantidade,
         preco_unitario AS price,
         subtotal
       FROM itens_pedido
       WHERE id_pedido = $1`,
      [pedidoId]
    )

    // 3) busca dados do cliente
    const clienteRes = await pool.query(
      `SELECT nome, email, telefone
       FROM clientes
       WHERE id = $1`,
      [pedido.id_cliente]
    )
    const customer = clienteRes.rows[0] || null

    // 4) busca endereço de entrega, se informado
    let endereco = null
    if (pedido.id_endereco_entrega) {
      const endRes = await pool.query(
        `SELECT
           apelido,
           rua,
           numero,
           complemento,
           bairro,
           cidade,
           estado,
           cep
         FROM enderecos_cliente
         WHERE id = $1`,
        [pedido.id_endereco_entrega]
      )
      endereco = endRes.rows[0] || null
    }

    // 5) retorna estrutura completa
    return res.json({
      ...pedido,
      items: itensRes.rows,
      customer,
      endereco
    })
  } catch (err: any) {
    console.error('Erro ao buscar pedido:', err)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// PUT /api/lojas/:lojaId/pedidos/:pedidoId/status
export const updatePedidoStatus = async (req: Request, res: Response) => {
  try {
    const { lojaId, pedidoId } = req.params
    const { status } = req.body

    const result = await pool.query(
      `UPDATE pedidos
         SET status = $1
       WHERE id_loja = $2
         AND id = $3
       RETURNING status`,
      [status, lojaId, pedidoId]
    )

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: 'Pedido não encontrado ou não pertence à loja' })
    }

    return res.json({ status: result.rows[0].status })
  } catch (err: any) {
    console.error('Erro ao atualizar status do pedido:', err)
    return res
      .status(500)
      .json({ error: 'Erro interno ao atualizar status' })
  }
}
