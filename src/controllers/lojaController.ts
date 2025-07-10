// src/controllers/lojaController.ts
import { Request, Response } from 'express';
import { pool } from '../database/connection';

// GET /api/lojas
export const getLojas = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, onboarded FROM lojas');
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
};

// GET /api/lojas/:id
export const getLojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, nome, cnpj, email, telefone,
              endereco_cep AS cep,
              endereco_rua AS rua,
              endereco_numero AS numero,
              endereco_bairro AS bairro,
              endereco_cidade AS cidade,
              endereco_estado AS estado,
              horario_funcionamento,
              onboarded
       FROM lojas
       WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar loja por ID:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// POST /api/lojas
export const createLoja = async (req: Request, res: Response) => {
  const {
    nome, cnpj, email, telefone,
    endereco_cep, endereco_rua, endereco_numero,
    endereco_bairro, endereco_cidade, endereco_estado,
    horario_funcionamento,
    banco, agencia, conta, tipo_conta
  } = req.body;

  try {
    const horariosJson = typeof horario_funcionamento === 'object'
      ? JSON.stringify(horario_funcionamento)
      : horario_funcionamento;

    const lojaResult = await pool.query(
      `INSERT INTO lojas (
         nome, cnpj, email, telefone,
         endereco_cep, endereco_rua, endereco_numero,
         endereco_bairro, endereco_cidade, endereco_estado,
         horario_funcionamento, onboarded
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, FALSE
       ) RETURNING id, nome, onboarded`,
      [
        nome, cnpj, email, telefone,
        endereco_cep, endereco_rua, endereco_numero,
        endereco_bairro, endereco_cidade, endereco_estado,
        horariosJson
      ]
    );
    const loja = lojaResult.rows[0];

    if (banco || agencia || conta || tipo_conta) {
      await pool.query(
        `INSERT INTO dados_bancarios_loja (
           id_loja, banco, agencia, conta, tipo_conta
         ) VALUES ($1,$2,$3,$4,$5)`,
        [loja.id, banco, agencia, conta, tipo_conta]
      );
    }

    return res.status(201).json({ message: 'Loja criada com sucesso', loja });
  } catch (error: any) {
    console.error('Erro ao criar loja:', error);
    if (error.code === '23505') {
      const msg = error.detail.includes('email')
        ? 'Este e-mail já está cadastrado.'
        : error.detail.includes('cnpj')
        ? 'Este CNPJ já está cadastrado.'
        : 'Registro duplicado.';
      return res.status(409).json({ error: msg });
    }
    return res.status(500).json({ error: 'Erro ao criar loja', detail: error.message });
  }
};

// PUT /api/lojas/:id
export const updateLoja = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    cep, rua, numero, bairro, cidade, estado,
    horario_funcionamento,
    banco, agencia, conta, tipo_conta
  } = req.body;

  if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
    return res.status(400).json({ error: 'Preencha todos os campos de endereço.' });
  }

  try {
    const horariosJson = typeof horario_funcionamento === 'object'
      ? JSON.stringify(horario_funcionamento)
      : horario_funcionamento;

    await pool.query(
      `UPDATE lojas SET
         endereco_cep=$1,
         endereco_rua=$2,
         endereco_numero=$3,
         endereco_bairro=$4,
         endereco_cidade=$5,
         endereco_estado=$6,
         horario_funcionamento=$7,
         onboarded=TRUE
       WHERE id=$8`,
      [cep, rua, numero, bairro, cidade, estado, horariosJson, id]
    );

    const banc = await pool.query(
      'SELECT id_loja FROM dados_bancarios_loja WHERE id_loja=$1',
      [id]
    );
    if (banc.rowCount) {
      await pool.query(
        `UPDATE dados_bancarios_loja SET
           banco=$1, agencia=$2, conta=$3, tipo_conta=$4
         WHERE id_loja=$5`,
        [banco, agencia, conta, tipo_conta, id]
      );
    } else {
      await pool.query(
        `INSERT INTO dados_bancarios_loja (
           id_loja, banco, agencia, conta, tipo_conta
         ) VALUES ($1,$2,$3,$4,$5)`,
        [id, banco, agencia, conta, tipo_conta]
      );
    }

    return res.json({ message: 'Loja e dados bancários atualizados com sucesso' });
  } catch (err: any) {
    console.error('❌ UPDATE LOJA ERROR:', err);
    return res.status(500).json({ error: 'Erro ao atualizar loja', detail: err.message });
  }
};

// GET /api/lojas/:id/dados-bancarios
export const getDadosBancarios = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM dados_bancarios_loja WHERE id_loja=$1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dados bancários não encontrados' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dados bancários:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados bancários' });
  }
};

// GET /api/lojas/:id/painel
export const getPainelLoja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lojaRes = await pool.query(
      'SELECT id, nome FROM lojas WHERE id=$1',
      [id]
    );
    if (lojaRes.rowCount === 0) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    const loja = lojaRes.rows[0];

    const ped = await pool.query(
      'SELECT COUNT(*) FROM pedidos WHERE id_loja=$1',
      [id]
    );
    const totalPedidos = parseInt(ped.rows[0].count, 10);

    const av = await pool.query(
      'SELECT ROUND(AVG(nota)::numeric,2) AS media FROM avaliacoes_loja WHERE id_loja=$1',
      [id]
    );
    const mediaAvaliacao = parseFloat(av.rows[0].media) || 0;

    const prod = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE id_loja=$1',
      [id]
    );
    const totalProdutos = parseInt(prod.rows[0].count, 10);

    const ult = await pool.query(
      `SELECT id, valor_total, criado_em
       FROM pedidos
       WHERE id_loja=$1
       ORDER BY criado_em DESC
       LIMIT 5`,
      [id]
    );

    return res.json({ loja, totalPedidos, mediaAvaliacao, totalProdutos, ultimosPedidos: ult.rows });
  } catch (error) {
    console.error('Erro ao carregar painel da loja:', error);
    return res.status(500).json({ error: 'Erro ao carregar painel' });
  }
};
