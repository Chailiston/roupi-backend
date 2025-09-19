"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validação das variáveis de ambiente essenciais para o envio de e-mail
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('As variáveis de ambiente do SMTP não estão completamente definidas.');
}
/**
 * ✅ CORREÇÃO: Adicionada a palavra-chave "export" para que o transporter possa ser importado em outros arquivos.
 * Configuração centralizada do Nodemailer Transporter.
 * Utiliza as variáveis de ambiente para a conexão com o servidor SMTP (Gmail).
 */
exports.transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // A porta 587 usa STARTTLS, então 'secure' deve ser false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // IMPORTANTE: Deve ser a senha de app gerada, sem espaços
    },
});
// Verifica a conexão com o servidor de e-mail ao iniciar o aplicativo
exports.transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Erro na configuração do Nodemailer. Verifique as credenciais SMTP no .env:', error);
    }
    else {
        console.log('✅ Nodemailer configurado e pronto para enviar e-mails.');
    }
});
