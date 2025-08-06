import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/lojas/:lojaId/produtos/:produtoId/variacoes
export const getVariacoesByProduto = async (req: Request, res: Response) => {
  const { lojaId, produtoId } = req.params;
  try {
    // 1) garante que o produto pertence à loja
    const produtoCheck = await pool.query(
      'SELECT id FROM produtos WHERE id = $1 AND id_loja = $2',
      [produtoId, lojaId]
    );
    if (produtoCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado para esta loja' });
    }

    // 2) busca as variações
    const result = await pool.query(
      `SELECT
         vp.id,
         vp.id_produto,
         vp.tamanho,
         vp.cor,
         vp.sku,
         vp.preco,
         vp.estoque,
         vp.ativo,
         vp.preco_extra,
         vp.peso,
         vp.imagem_url
       FROM variacoes_produto vp
       WHERE vp.id_produto = $1
       ORDER BY vp.id`,
      [produtoId]
    );

    return res.json(result.rows);
  } catch (error: any) {
    console.error('getVariacoesByProduto error:', error.message, '\n', error.stack);
    return res.status(500).json({ error: 'Erro ao buscar variações' });
  }
};

// POST /api/lojas/:lojaId/produtos/:produtoId/variacoes
export const createVariacao = async (req: Request, res: Response) => {
  const { lojaId, produtoId } = req.params;
  const {
    tamanho,
    cor,
    sku,
    preco,
    estoque,
    ativo = true,
    preco_extra = 0,
    peso = null,
    imagem_url = null,
  } = req.body;

  try {
    // 1) garante que o produto pertence à loja
    const produtoCheck = await pool.query(
      'SELECT id FROM produtos WHERE id = $1 AND id_loja = $2',
      [produtoId, lojaId]
    );
    if (produtoCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado para esta loja' });
    }

    // 2) cria a variação
    const result = await pool.query(
      `INSERT INTO variacoes_produto
         (id_produto, tamanho, cor, sku, preco, estoque, ativo, preco_extra, peso, imagem_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING
         id,
         id_produto,
         tamanho,
         cor,
         sku,
         preco,
         estoque,
         ativo,
         preco_extra,
         peso,
         imagem_url`,
      [produtoId, tamanho, cor, sku, preco, estoque, ativo, preco_extra, peso, imagem_url]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('createVariacao error:', error.message, '\n', error.stack);
    return res.status(500).json({ error: 'Erro ao criar variação' });
  }
};

// PUT /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
export const updateVariacao = async (req: Request, res: Response) => {
  const { lojaId, produtoId, id } = req.params;
  const {
    tamanho,
    cor,
    sku,
    preco,
    estoque,
    ativo,
    preco_extra,
    peso,
    imagem_url,
  } = req.body;

  try {
    // 1) garante que a variação existe e pertence ao produto e à loja
    const variacaoCheck = await pool.query(
      `SELECT v.id
       FROM variacoes_produto v
       JOIN produtos p ON v.id_produto = p.id
       WHERE v.id = $1 AND v.id_produto = $2 AND p.id_loja = $3`,
      [id, produtoId, lojaId]
    );
    if (variacaoCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Variação não encontrada para este produto/loja' });
    }

    // 2) atualiza a variação
    const result = await pool.query(
      `UPDATE variacoes_produto
         SET tamanho=$1,
             cor=$2,
             sku=$3,
             preco=$4,
             estoque=$5,
             ativo=$6,
             preco_extra=$7,
             peso=$8,
             imagem_url=$9
       WHERE id=$10
       RETURNING
         id,
         id_produto,
         tamanho,
         cor,
         sku,
         preco,
         estoque,
         ativo,
         preco_extra,
         peso,
         imagem_url`,
      [tamanho, cor, sku, preco, estoque, ativo, preco_extra, peso, imagem_url, id]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('updateVariacao error:', error.message, '\n', error.stack);
    return res.status(500).json({ error: 'Erro ao atualizar variação' });
  }
};

// DELETE /api/lojas/:lojaId/produtos/:produtoId/variacoes/:id
export const deleteVariacao = async (req: Request, res: Response) => {
  const { lojaId, produtoId, id } = req.params;
  try {
    // 1) garante que a variação existe e pertence ao produto e à loja
    const variacaoCheck = await pool.query(
      `SELECT v.id
       FROM variacoes_produto v
       JOIN produtos p ON v.id_produto = p.id
       WHERE v.id = $1 AND v.id_produto = $2 AND p.id_loja = $3`,
      [id, produtoId, lojaId]
    );
    if (variacaoCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Variação não encontrada para este produto/loja' });
    }

    // 2) deleta
    await pool.query(`DELETE FROM variacoes_produto WHERE id=$1`, [id]);
    return res.status(204).send();
  } catch (error: any) {
    console.error('deleteVariacao error:', error.message, '\n', error.stack);
    return res.status(500).json({ error: 'Erro ao excluir variação' });
  }
};
