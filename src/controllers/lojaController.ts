// src/controllers/lojasController.ts
import { Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../database/connection';
// @ts-ignore
import { Expo } from 'expo-server-sdk';
import crypto from 'crypto';

const upload = multer({ dest: 'uploads/logos/' });
const expo = new Expo();

/**
 * Busca dados básicos da loja (endereço, onboarding e logo).
 */
async function fetchLoja(id: string) {
  const { rows } = await pool.query(
    `SELECT
        id, nome, cnpj, email, telefone,
        endereco_cep   AS cep,
        endereco_rua   AS rua,
        endereco_numero AS numero,
        endereco_bairro AS bairro,
        endereco_cidade AS cidade,
        endereco_estado AS estado,
        horario_funcionamento,
        logo_url,
        onboarded
     FROM lojas
     WHERE id = $1`,
    [id]
  );
  return rows[0];
}

/**
 * Insere ou atualiza dados bancários da loja.
 */
async function upsertDadosBancarios(
  id: string,
  banco?: string,
  agencia?: string,
  conta?: string,
  tipo_conta?: string
) {
  if (!banco && !agencia && !conta && !tipo_conta) return;

  const { rowCount } = await pool.query(
    'SELECT 1 FROM dados_bancarios_loja WHERE id_loja = $1',
    [id]
  );

  if (rowCount) {
    await pool.query(
      `UPDATE dados_bancarios_loja SET
         banco      = $1,
         agencia    = $2,
         conta      = $3,
         tipo_conta = $4
       WHERE id_loja = $5`,
      [banco, agencia, conta, tipo_conta, id]
    );
  } else {
    await pool.query(
      `INSERT INTO dados_bancarios_loja
         (id_loja, banco, agencia, conta, tipo_conta)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, banco, agencia, conta, tipo_conta]
    );
  }
}

/**
 * Insere ou atualiza configurações de pagamento da loja.
 */
async function upsertPaymentSettings(
  id: string,
  provider?: string,
  api_key?: string,
  webhook_secret?: string,
  currency?: string,
  ativo?: boolean
) {
  if (!provider && !api_key && !currency && ativo === undefined) return;

  const { rowCount } = await pool.query(
    'SELECT 1 FROM loja_payment_settings WHERE id_loja = $1',
    [id]
  );

  if (rowCount) {
    await pool.query(
      `UPDATE loja_payment_settings SET
         provider       = $1,
         api_key        = $2,
         webhook_secret = $3,
         currency       = $4,
         ativo          = $5
       WHERE id_loja = $6`,
      [provider, api_key, webhook_secret, currency, ativo, id]
    );
  } else {
    await pool.query(
      `INSERT INTO loja_payment_settings
         (id_loja, provider, api_key, webhook_secret, currency, ativo)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, provider, api_key, webhook_secret, currency, ativo]
    );
  }
}

// GET /api/lojas
export const getLojas = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, logo_url, onboarded FROM lojas'
    );
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
};

// GET /api/lojas/:id
export const getLojaById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const loja = await fetchLoja(id);
    if (!loja) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    return res.json(loja);
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
    horario_funcionamento, banco, agencia, conta, tipo_conta
  } = req.body;

  try {
    const horariosJson =
      typeof horario_funcionamento === 'object'
        ? JSON.stringify(horario_funcionamento)
        : horario_funcionamento;

    const { rows } = await pool.query(
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
    const loja = rows[0];

    // upsert dados bancários se vierem
    await upsertDadosBancarios(loja.id, banco, agencia, conta, tipo_conta);

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
    return res
      .status(500)
      .json({ error: 'Erro ao criar loja', detail: error.message });
  }
};

// PUT /api/lojas/:id
export const updateLoja = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nome, email, telefone,
    cep, rua, numero, bairro, cidade, estado,
    horario_funcionamento, banco, agencia, conta, tipo_conta, logo_url
  } = req.body;

  if (!nome || !email || !telefone) {
    return res
      .status(400)
      .json({ error: 'Preencha nome, e-mail e telefone.' });
  }
  if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
    return res
      .status(400)
      .json({ error: 'Preencha todos os campos de endereço.' });
  }

  try {
    const horariosJson =
      typeof horario_funcionamento === 'object'
        ? JSON.stringify(horario_funcionamento)
        : horario_funcionamento;

    // Atualiza a tabela lojas
    await pool.query(
      `UPDATE lojas SET
         nome                  = $1,
         email                 = $2,
         telefone              = $3,
         endereco_cep          = $4,
         endereco_rua          = $5,
         endereco_numero       = $6,
         endereco_bairro       = $7,
         endereco_cidade       = $8,
         endereco_estado       = $9,
         horario_funcionamento = $10,
         logo_url              = COALESCE($11, logo_url),
         onboarded             = TRUE
       WHERE id = $12`,
      [
        nome, email, telefone,
        cep, rua, numero, bairro, cidade, estado,
        horariosJson, logo_url, id
      ]
    );

    // upsert dados bancários
    await upsertDadosBancarios(id, banco, agencia, conta, tipo_conta);

    // retorna perfil completo atualizado
    const loja = await fetchLoja(id);
    return res.json(loja);
  } catch (err: any) {
    console.error('❌ UPDATE LOJA ERROR:', err);
    return res
      .status(500)
      .json({ error: 'Erro ao atualizar loja', detail: err.message });
  }
};

// POST /api/lojas/:id/logo
export const uploadLogo = [
  upload.single('logo'),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }
    const urlLogo = `/static/logos/${req.file.filename}`;
    await pool.query(
      'UPDATE lojas SET logo_url = $1 WHERE id = $2',
      [urlLogo, id]
    );
    const loja = await fetchLoja(id);
    return res.json(loja);
  }
];

// GET /api/lojas/:id/dados-bancarios
export const getDadosBancarios = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM dados_bancarios_loja WHERE id_loja = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dados bancários não encontrados' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dados bancários:', error);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar dados bancários' });
  }
};

// GET /api/lojas/:id/painel
export const getPainelLoja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lojaRes = await pool.query(
      'SELECT id, nome FROM lojas WHERE id = $1',
      [id]
    );
    if (lojaRes.rowCount === 0) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    const loja = lojaRes.rows[0];
    const ped = await pool.query(
      'SELECT COUNT(*) FROM pedidos WHERE id_loja = $1',
      [id]
    );
    const totalPedidos = parseInt(ped.rows[0].count, 10);
    const av = await pool.query(
      'SELECT ROUND(AVG(nota)::numeric,2) AS media FROM avaliacoes_loja WHERE id_loja = $1',
      [id]
    );
    const mediaAvaliacao = parseFloat(av.rows[0].media) || 0;
    const prod = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE id_loja = $1',
      [id]
    );
    const totalProdutos = parseInt(prod.rows[0].count, 10);
    const ult = await pool.query(
      `SELECT id, valor_total, criado_em
       FROM pedidos
       WHERE id_loja = $1
       ORDER BY criado_em DESC
       LIMIT 5`,
      [id]
    );

    return res.json({
      loja,
      totalPedidos,
      mediaAvaliacao,
      totalProdutos,
      ultimosPedidos: ult.rows
    });
  } catch (error) {
    console.error('Erro ao carregar painel da loja:', error);
    return res.status(500).json({ error: 'Erro ao carregar painel' });
  }
};

// GET /api/lojas/:id/payment-settings
export const getPaymentSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT provider, currency, ativo FROM loja_payment_settings WHERE id_loja = $1',
      [id]
    );
    return res.json(rows[0] || {});
  } catch (error) {
    console.error('Erro ao buscar payment settings:', error);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar payment settings' });
  }
};

// PUT /api/lojas/:id/payment-settings
export const updatePaymentSettings = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { provider, api_key, webhook_secret, currency, ativo } = req.body;

  try {
    await upsertPaymentSettings(
      id,
      provider,
      api_key,
      webhook_secret,
      currency,
      ativo
    );
    return res.json({ message: 'Payment settings atualizados' });
  } catch (error: any) {
    console.error('Erro ao atualizar payment settings:', error);
    return res
      .status(500)
      .json({ error: 'Erro ao atualizar payment settings' });
  }
};

// POST /api/lojas/:id/notify-order
export const notifyNewOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pedido } = req.body;
  try {
    const { rows: tokens } = await pool.query(
      'SELECT fcm_token FROM tokens_push_loja WHERE id_loja = $1',
      [id]
    );
    const messages = tokens
      .filter(t => Expo.isExpoPushToken(t.fcm_token))
      .map(t => ({
        to: t.fcm_token,
        sound: 'default',
        title: `Novo pedido #${pedido.id}`,
        body: `Valor: R$ ${pedido.valor_total.toFixed(2)}`,
        data: { pedidoId: pedido.id }
      }));
    for (const chunk of expo.chunkPushNotifications(messages)) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    return res.json({ message: 'Notificações enviadas' });
  } catch (err) {
    console.error('Erro enviando push:', err);
    return res.status(500).json({ error: 'Falha ao enviar notificações' });
  }
};
