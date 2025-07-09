import { Request, Response } from 'express';
import { pool } from '../database/connection';

// Buscar todas as lojas
export const getLojas = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM lojas');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
};

// Criar nova loja com dados bancários (sem logo por enquanto)
export const createLoja = async (req: Request, res: Response) => {
  const {
    nome,
    cnpj,
    email,
    telefone,
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_estado,
    endereco_cep,
    horario_funcionamento,
    banco,
    agencia,
    conta,
    tipo_conta
  } = req.body;

  try {
    const lojaResult = await pool.query(
      `INSERT INTO lojas (
        nome, cnpj, email, telefone,
        endereco_rua, endereco_numero, endereco_bairro,
        endereco_cidade, endereco_estado, endereco_cep,
        horario_funcionamento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        nome,
        cnpj,
        email,
        telefone,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_estado,
        endereco_cep,
        horario_funcionamento
      ]
    );

    const loja = lojaResult.rows[0];

    await pool.query(
      `INSERT INTO dados_bancarios_loja (
        id_loja, banco, agencia, conta, tipo_conta
      ) VALUES ($1, $2, $3, $4, $5)`,
      [loja.id, banco, agencia, conta, tipo_conta]
    );

    res.status(201).json({ message: 'Loja criada com sucesso', loja });
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    res.status(500).json({ error: 'Erro ao criar loja' });
  }
};

// Atualizar loja e dados bancários (sem logo)
export const updateLoja = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nome,
    cnpj,
    email,
    telefone,
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_estado,
    endereco_cep,
    horario_funcionamento,
    banco,
    agencia,
    conta,
    tipo_conta
  } = req.body;

  try {
    await pool.query(
      `UPDATE lojas SET
        nome = $1,
        cnpj = $2,
        email = $3,
        telefone = $4,
        endereco_rua = $5,
        endereco_numero = $6,
        endereco_bairro = $7,
        endereco_cidade = $8,
        endereco_estado = $9,
        endereco_cep = $10,
        horario_funcionamento = $11
      WHERE id = $12`,
      [
        nome,
        cnpj,
        email,
        telefone,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_estado,
        endereco_cep,
        horario_funcionamento,
        id
      ]
    );

    const result = await pool.query(
      `SELECT id FROM dados_bancarios_loja WHERE id_loja = $1`,
      [id]
    );

    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE dados_bancarios_loja SET
          banco = $1,
          agencia = $2,
          conta = $3,
          tipo_conta = $4
        WHERE id_loja = $5`,
        [banco, agencia, conta, tipo_conta, id]
      );
    } else {
      await pool.query(
        `INSERT INTO dados_bancarios_loja (
          id_loja, banco, agencia, conta, tipo_conta
        ) VALUES ($1, $2, $3, $4, $5)`,
        [id, banco, agencia, conta, tipo_conta]
      );
    }

    res.json({ message: 'Loja e dados bancários atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
};

// Buscar dados bancários da loja
export const getDadosBancarios = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM dados_bancarios_loja WHERE id_loja = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dados bancários não encontrados' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dados bancários:', error);
    res.status(500).json({ error: 'Erro ao buscar dados bancários' });
  }
};

// Painel da loja
export const getPainelLoja = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const lojaResult = await pool.query('SELECT id, nome FROM lojas WHERE id = $1', [id]);
    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    const loja = lojaResult.rows[0];

    const pedidosResult = await pool.query(
      'SELECT COUNT(*) FROM pedidos WHERE id_loja = $1',
      [id]
    );
    const totalPedidos = parseInt(pedidosResult.rows[0].count);

    const avaliacoesResult = await pool.query(
      'SELECT ROUND(AVG(nota)::numeric, 2) as media FROM avaliacoes_loja WHERE id_loja = $1',
      [id]
    );
    const mediaAvaliacao = parseFloat(avaliacoesResult.rows[0].media || 0);

    const produtosResult = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE id_loja = $1',
      [id]
    );
    const totalProdutos = parseInt(produtosResult.rows[0].count);

    const ultimosPedidosResult = await pool.query(
      `SELECT id, valor_total, criado_em
       FROM pedidos
       WHERE id_loja = $1
       ORDER BY criado_em DESC
       LIMIT 5`,
      [id]
    );

    res.json({
      loja,
      totalPedidos,
      mediaAvaliacao,
      totalProdutos,
      ultimosPedidos: ultimosPedidosResult.rows
    });
  } catch (error) {
    console.error('Erro ao carregar painel da loja:', error);
    res.status(500).json({ error: 'Erro ao carregar painel da loja' });
  }
};
