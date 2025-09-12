"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFavoriteStatus = exports.removeFavorite = exports.addFavorite = exports.listFavorites = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * @route   GET /api/cliente/favoritos
 * @desc    Listar todos os produtos favoritados pelo cliente
 * @access  Private
 */
const listFavorites = async (req, res) => {
    const clienteId = req.user?.id;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const favorites = await prisma.favoritos.findMany({
            where: { id_cliente: clienteId },
            include: {
                produtos: {
                    include: {
                        lojas: true,
                        produtos_imagens: {
                            orderBy: {
                                ordem: 'asc'
                            },
                            take: 1
                        },
                        precos_promocao: {
                            where: {
                                data_inicio: { lte: new Date() },
                                data_fim: { gte: new Date() },
                            },
                            orderBy: {
                                data_inicio: 'desc'
                            },
                            take: 1
                        }
                    }
                }
            }
        });
        const formattedFavorites = favorites.map((fav) => {
            const produto = fav.produtos;
            if (!produto || !produto.ativo)
                return null;
            const preco_promocional = produto.precos_promocao[0]?.preco_promocional;
            const preco_atual = preco_promocional ?? produto.preco_base;
            const imagem_url = produto.produtos_imagens[0]?.url || produto.imagem_url;
            return {
                id_produto: produto.id,
                nome: produto.nome,
                preco_base: produto.preco_base.toNumber(), // <-- CORRIGIDO: Converte para número
                preco_atual: preco_atual.toNumber(), // <-- CORRIGIDO: Converte para número
                imagem_url: imagem_url,
                nome_loja: produto.lojas.nome
            };
        }).filter(Boolean);
        res.json(formattedFavorites);
    }
    catch (error) {
        console.error('Erro ao listar favoritos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listFavorites = listFavorites;
/**
 * @route   POST /api/cliente/favoritos
 * @desc    Adicionar um produto aos favoritos
 * @access  Private
 */
const addFavorite = async (req, res) => {
    const clienteId = req.user?.id;
    const { produto_id } = req.body;
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    if (!produto_id) {
        return res.status(400).json({ message: 'O ID do produto é obrigatório.' });
    }
    try {
        const existingFavorite = await prisma.favoritos.findFirst({
            where: {
                id_cliente: clienteId,
                id_produto: produto_id
            }
        });
        if (existingFavorite) {
            return res.status(200).json({ message: 'Produto já está nos favoritos.' });
        }
        const newFavorite = await prisma.favoritos.create({
            data: {
                id_cliente: clienteId,
                id_produto: produto_id
            }
        });
        res.status(201).json(newFavorite);
    }
    catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.addFavorite = addFavorite;
/**
 * @route   DELETE /api/cliente/favoritos/:productId
 * @desc    Remover um produto dos favoritos
 * @access  Private
 */
const removeFavorite = async (req, res) => {
    const clienteId = req.user?.id;
    const productId = parseInt(req.params.productId, 10);
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'O ID do produto é inválido.' });
    }
    try {
        const result = await prisma.favoritos.deleteMany({
            where: {
                id_cliente: clienteId,
                id_produto: productId
            }
        });
        if (result.count === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.removeFavorite = removeFavorite;
/**
 * @route   GET /api/cliente/favoritos/status/:productId
 * @desc    Verificar se um produto está favoritado
 * @access  Private
 */
const checkFavoriteStatus = async (req, res) => {
    const clienteId = req.user?.id;
    const productId = parseInt(req.params.productId, 10);
    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'O ID do produto é inválido.' });
    }
    try {
        const favorite = await prisma.favoritos.findFirst({
            where: {
                id_cliente: clienteId,
                id_produto: productId
            }
        });
        res.json({ isFavorited: !!favorite });
    }
    catch (error) {
        console.error('Erro ao verificar status do favorito:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.checkFavoriteStatus = checkFavoriteStatus;
