"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyNewOrder = exports.updatePaymentSettings = exports.getPaymentSettings = exports.getPainelLoja = exports.getDadosBancarios = exports.updateLoja = exports.createLoja = exports.getLojaById = exports.getLojas = void 0;
const connection_1 = require("../database/connection");
// @ts-ignore
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
/**
 * Busca dados básicos da loja (endereço, onboarding, logo) e os dados bancários.
 */
async function fetchLoja(id) {
    const { rows } = await connection_1.pool.query(`SELECT
       l.id,
       l.nome,
       l.cnpj,
       l.email,
       l.telefone,
       l.endereco_cep    AS cep,
       l.endereco_rua    AS rua,
       l.endereco_numero AS numero,
       l.endereco_bairro AS bairro,
       l.endereco_cidade AS cidade,
       l.endereco_estado AS estado,
       l.horario_funcionamento,
       l.logo_url,
       l.onboarded,
       db.banco,
       db.agencia,
       db.conta,
       db.tipo_conta
     FROM lojas l
     LEFT JOIN dados_bancarios_loja db
       ON db.id_loja = l.id
     WHERE l.id = $1`, [id]);
    return rows[0];
}
/**
 * Insere ou atualiza dados bancários da loja.
 */
async function upsertDadosBancarios(id, banco, agencia, conta, tipo_conta) {
    if (!banco && !agencia && !conta && !tipo_conta)
        return;
    const { rowCount } = await connection_1.pool.query('SELECT 1 FROM dados_bancarios_loja WHERE id_loja = $1', [id]);
    if (rowCount) {
        await connection_1.pool.query(`UPDATE dados_bancarios_loja SET
         banco      = $1,
         agencia    = $2,
         conta      = $3,
         tipo_conta = $4
       WHERE id_loja = $5`, [banco, agencia, conta, tipo_conta, id]);
    }
    else {
        await connection_1.pool.query(`INSERT INTO dados_bancarios_loja
         (id_loja, banco, agencia, conta, tipo_conta)
       VALUES ($1,$2,$3,$4,$5)`, [id, banco, agencia, conta, tipo_conta]);
    }
}
/**
 * Insere ou atualiza configurações de pagamento da loja.
 */
async function upsertPaymentSettings(id, provider, api_key, webhook_secret, currency, ativo) {
    if (!provider && !api_key && !currency && ativo === undefined)
        return;
    const { rowCount } = await connection_1.pool.query('SELECT 1 FROM loja_payment_settings WHERE id_loja = $1', [id]);
    if (rowCount) {
        await connection_1.pool.query(`UPDATE loja_payment_settings SET
         provider       = $1,
         api_key        = $2,
         webhook_secret = $3,
         currency       = $4,
         ativo          = $5
       WHERE id_loja = $6`, [provider, api_key, webhook_secret, currency, ativo, id]);
    }
    else {
        await connection_1.pool.query(`INSERT INTO loja_payment_settings
         (id_loja, provider, api_key, webhook_secret, currency, ativo)
       VALUES ($1,$2,$3,$4,$5,$6)`, [id, provider, api_key, webhook_secret, currency, ativo]);
    }
}
// GET /api/lojas
const getLojas = async (req, res) => {
    try {
        const { rows } = await connection_1.pool.query('SELECT id, nome, logo_url, onboarded FROM lojas');
        return res.json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar lojas:', error);
        return res.status(500).json({ error: 'Erro ao buscar lojas' });
    }
};
exports.getLojas = getLojas;
// GET /api/lojas/:id
const getLojaById = async (req, res) => {
    const { id } = req.params;
    try {
        const loja = await fetchLoja(id);
        if (!loja) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }
        return res.json(loja);
    }
    catch (error) {
        console.error('Erro ao buscar loja por ID:', error);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
exports.getLojaById = getLojaById;
// POST /api/lojas
const createLoja = async (req, res) => {
    const { nome, cnpj, email, telefone, endereco_cep, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, horario_funcionamento, banco, agencia, conta, tipo_conta } = req.body;
    try {
        const horariosJson = typeof horario_funcionamento === 'object'
            ? JSON.stringify(horario_funcionamento)
            : horario_funcionamento;
        const { rows } = await connection_1.pool.query(`INSERT INTO lojas (
         nome, cnpj, email, telefone,
         endereco_cep, endereco_rua, endereco_numero,
         endereco_bairro, endereco_cidade, endereco_estado,
         horario_funcionamento, onboarded
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, FALSE
       ) RETURNING id, nome, onboarded`, [
            nome, cnpj, email, telefone,
            endereco_cep, endereco_rua, endereco_numero,
            endereco_bairro, endereco_cidade, endereco_estado,
            horariosJson
        ]);
        const loja = rows[0];
        await upsertDadosBancarios(loja.id, banco, agencia, conta, tipo_conta);
        return res.status(201).json({ message: 'Loja criada com sucesso', loja });
    }
    catch (error) {
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
exports.createLoja = createLoja;
// PUT /api/lojas/:id
const updateLoja = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, cep, rua, numero, bairro, cidade, estado, horario_funcionamento, banco, agencia, conta, tipo_conta, logo_url } = req.body;
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
        const horariosJson = typeof horario_funcionamento === 'object'
            ? JSON.stringify(horario_funcionamento)
            : horario_funcionamento;
        // Atualiza a tabela lojas (agora logo_url vem direto no body)
        await connection_1.pool.query(`UPDATE lojas SET
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
         logo_url              = $11,
         onboarded             = TRUE
       WHERE id = $12`, [
            nome, email, telefone,
            cep, rua, numero, bairro, cidade, estado,
            horariosJson, logo_url, id
        ]);
        await upsertDadosBancarios(id, banco, agencia, conta, tipo_conta);
        const loja = await fetchLoja(id);
        return res.json(loja);
    }
    catch (err) {
        console.error('❌ UPDATE LOJA ERROR:', err);
        return res
            .status(500)
            .json({ error: 'Erro ao atualizar loja', detail: err.message });
    }
};
exports.updateLoja = updateLoja;
// GET /api/lojas/:id/dados-bancarios
const getDadosBancarios = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await connection_1.pool.query('SELECT * FROM dados_bancarios_loja WHERE id_loja = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Dados bancários não encontrados' });
        }
        return res.json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao buscar dados bancários:', error);
        return res
            .status(500)
            .json({ error: 'Erro ao buscar dados bancários' });
    }
};
exports.getDadosBancarios = getDadosBancarios;
// GET /api/lojas/:id/painel
const getPainelLoja = async (req, res) => {
    try {
        const { id } = req.params;
        const lojaRes = await connection_1.pool.query('SELECT id, nome FROM lojas WHERE id = $1', [id]);
        if (lojaRes.rowCount === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }
        const loja = lojaRes.rows[0];
        const ped = await connection_1.pool.query('SELECT COUNT(*) FROM pedidos WHERE id_loja = $1', [id]);
        const totalPedidos = parseInt(ped.rows[0].count, 10);
        const av = await connection_1.pool.query('SELECT ROUND(AVG(nota)::numeric,2) AS media FROM avaliacoes_loja WHERE id_loja = $1', [id]);
        const mediaAvaliacao = parseFloat(av.rows[0].media) || 0;
        const prod = await connection_1.pool.query('SELECT COUNT(*) FROM produtos WHERE id_loja = $1', [id]);
        const totalProdutos = parseInt(prod.rows[0].count, 10);
        const ult = await connection_1.pool.query(`SELECT id, valor_total, criado_em
       FROM pedidos
       WHERE id_loja = $1
       ORDER BY criado_em DESC
       LIMIT 5`, [id]);
        return res.json({
            loja,
            totalPedidos,
            mediaAvaliacao,
            totalProdutos,
            ultimosPedidos: ult.rows
        });
    }
    catch (error) {
        console.error('Erro ao carregar painel da loja:', error);
        return res.status(500).json({ error: 'Erro ao carregar painel' });
    }
};
exports.getPainelLoja = getPainelLoja;
// GET /api/lojas/:id/payment-settings
const getPaymentSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await connection_1.pool.query('SELECT provider, currency, ativo FROM loja_payment_settings WHERE id_loja = $1', [id]);
        return res.json(rows[0] || {});
    }
    catch (error) {
        console.error('Erro ao buscar payment settings:', error);
        return res
            .status(500)
            .json({ error: 'Erro ao buscar payment settings' });
    }
};
exports.getPaymentSettings = getPaymentSettings;
// PUT /api/lojas/:id/payment-settings
const updatePaymentSettings = async (req, res) => {
    const { id } = req.params;
    const { provider, api_key, webhook_secret, currency, ativo } = req.body;
    try {
        await upsertPaymentSettings(id, provider, api_key, webhook_secret, currency, ativo);
        return res.json({ message: 'Payment settings atualizados' });
    }
    catch (error) {
        console.error('Erro ao atualizar payment settings:', error);
        return res
            .status(500)
            .json({ error: 'Erro ao atualizar payment settings' });
    }
};
exports.updatePaymentSettings = updatePaymentSettings;
// POST /api/lojas/:id/notify-order
const notifyNewOrder = async (req, res) => {
    const { id } = req.params;
    const { pedido } = req.body;
    try {
        const { rows: tokens } = await connection_1.pool.query('SELECT fcm_token FROM tokens_push_loja WHERE id_loja = $1', [id]);
        const messages = tokens
            .filter(t => expo_server_sdk_1.Expo.isExpoPushToken(t.fcm_token))
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
    }
    catch (err) {
        console.error('Erro enviando push:', err);
        return res.status(500).json({ error: 'Falha ao enviar notificações' });
    }
};
exports.notifyNewOrder = notifyNewOrder;
