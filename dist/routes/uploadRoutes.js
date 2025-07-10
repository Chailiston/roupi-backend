"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = __importDefault(require("../utils/upload"));
const router = express_1.default.Router();
/**
 * POST /api/upload/imagem
 * Envia imagem e retorna a URL do arquivo salvo
 */
router.post('/imagem', upload_1.default.single('arquivo'), // o nome do campo no formulário deve ser "arquivo"
(req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
        message: 'Upload realizado com sucesso!',
        imageUrl,
    });
});
exports.default = router;
