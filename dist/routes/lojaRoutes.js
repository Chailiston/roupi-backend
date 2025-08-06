"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lojaController_1 = require("../controllers/lojaController");
const router = (0, express_1.Router)();
// Listar todas as lojas
router.get('/', lojaController_1.getLojas);
// Buscar loja por ID (já traz também dados bancários via LEFT JOIN)
router.get('/:id', lojaController_1.getLojaById);
// Criar loja
router.post('/', lojaController_1.createLoja);
// Atualizar loja (dados básicos + bancários)
router.put('/:id', lojaController_1.updateLoja);
// Obter dados bancários (separado, caso precise endpoint dedicado)
router.get('/:id/dados-bancarios', lojaController_1.getDadosBancarios);
// Painel da loja (estatísticas, últimos pedidos etc)
router.get('/:id/painel', lojaController_1.getPainelLoja);
// Configurações de pagamento
router.get('/:id/payment-settings', lojaController_1.getPaymentSettings);
router.put('/:id/payment-settings', lojaController_1.updatePaymentSettings);
// Notificação de novo pedido (push)
router.post('/:id/notify-order', lojaController_1.notifyNewOrder);
exports.default = router;
