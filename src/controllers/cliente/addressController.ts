import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_ADDRESSES_PER_USER = 5;

// ✅ SOLUÇÃO: Função auxiliar para converter coordenadas para número de forma segura.
// Trata valores nulos, vazios e substitui vírgula por ponto.
const parseCoordinate = (coord: any): number | null => {
    if (coord === undefined || coord === null || String(coord).trim() === '') {
        return null;
    }
    const num = parseFloat(String(coord).replace(',', '.'));
    return isNaN(num) ? null : num;
};


/**
 * @route GET /api/cliente/enderecos
 * @description Lista os endereços ativos de um cliente.
 */
export const getAddresses = async (req: Request, res: Response) => {
    const clienteId = req.user?.id;

    if (!clienteId) {
        return res.status(401).json({ message: 'Cliente não autenticado.' });
    }

    try {
        const addresses = await prisma.enderecos_cliente.findMany({
            where: { id_cliente: clienteId, ativo: true },
            orderBy: [{ padrao: 'desc' }, { criado_em: 'desc' }],
        });
        res.status(200).json(addresses);
    } catch (error) {
        console.error('Erro ao listar endereços:', error);
        res.status(500).json({ message: 'Erro interno ao buscar endereços.' });
    }
};

/**
 * @route POST /api/cliente/enderecos
 * @description Adiciona um novo endereço para o cliente.
 */
export const addAddress = async (req: Request, res: Response) => {
    const clienteId = req.user?.id;
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, padrao } = req.body;

    // ✅ SOLUÇÃO: Usamos a função auxiliar para garantir que a latitude e a longitude sejam números.
    const latitude = parseCoordinate(req.body.latitude);
    const longitude = parseCoordinate(req.body.longitude);

    if (!clienteId) {
        return res.status(401).json({ message: 'Cliente não autenticado.' });
    }
    if (!rua || !bairro || !cidade || !estado || !cep) {
        return res.status(400).json({ message: 'Campos obrigatórios (rua, bairro, cidade, estado, cep) não foram preenchidos.' });
    }

    try {
        const addressCount = await prisma.enderecos_cliente.count({
            where: { id_cliente: clienteId, ativo: true },
        });

        if (addressCount >= MAX_ADDRESSES_PER_USER) {
            return res.status(400).json({ message: `Você pode ter no máximo ${MAX_ADDRESSES_PER_USER} endereços cadastrados.` });
        }

        const similarAddress = await prisma.enderecos_cliente.findFirst({
            where: {
                id_cliente: clienteId,
                rua: { equals: rua, mode: 'insensitive' },
                numero: { equals: numero || null },
                cep: cep,
                ativo: true
            }
        });

        if(similarAddress) {
            return res.status(409).json({ message: 'Este endereço já está cadastrado.' });
        }
        
        const newAddress = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (padrao) {
                await tx.enderecos_cliente.updateMany({
                    where: { id_cliente: clienteId },
                    data: { padrao: false },
                });
            }

            return tx.enderecos_cliente.create({
                data: {
                    id_cliente: clienteId,
                    apelido, rua, numero, complemento, bairro, cidade, estado, cep,
                    padrao: padrao || false,
                    latitude, // Agora é um número ou nulo
                    longitude, // Agora é um número ou nulo
                    ativo: true,
                },
            });
        });

        res.status(201).json(newAddress);
    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.status(500).json({ message: 'Erro interno ao adicionar endereço.' });
    }
};

/**
 * @route PUT /api/cliente/enderecos/:id
 * @description Atualiza um endereço existente.
 */
export const updateAddress = async (req: Request, res: Response) => {
    const clienteId = req.user?.id;
    const addressId = parseInt(req.params.id, 10);
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, padrao } = req.body;

    // ✅ SOLUÇÃO: Usamos a função auxiliar aqui também para consistência.
    const latitude = parseCoordinate(req.body.latitude);
    const longitude = parseCoordinate(req.body.longitude);

    if (!clienteId) {
        return res.status(401).json({ message: 'Cliente não autenticado.' });
    }

    try {
        const addressToUpdate = await prisma.enderecos_cliente.findFirst({
            where: { id: addressId, id_cliente: clienteId }
        });

        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Endereço não encontrado ou não pertence a este usuário.' });
        }

        const updatedAddress = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (padrao) {
                await tx.enderecos_cliente.updateMany({
                    where: { id_cliente: clienteId, NOT: { id: addressId } },
                    data: { padrao: false },
                });
            }
            
            return tx.enderecos_cliente.update({
                where: { id: addressId },
                data: { apelido, rua, numero, complemento, bairro, cidade, estado, cep, padrao, latitude, longitude },
            });
        });
        
        res.status(200).json(updatedAddress);
    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar o endereço.' });
    }
};

/**
 * @route PATCH /api/cliente/enderecos/:id/set-default
 * @description Define um endereço como padrão.
 */
export const setDefaultAddress = async (req: Request, res: Response) => {
    const clienteId = req.user?.id;
    const addressId = parseInt(req.params.id, 10);

    if (!clienteId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    try {
        const addressToUpdate = await prisma.enderecos_cliente.findFirst({
            where: { id: addressId, id_cliente: clienteId, ativo: true }
        });

        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Endereço não encontrado, inativo, ou não pertence a este usuário.' });
        }

        await prisma.$transaction([
            prisma.enderecos_cliente.updateMany({
                where: { id_cliente: clienteId },
                data: { padrao: false },
            }),
            prisma.enderecos_cliente.update({
                where: { id: addressId },
                data: { padrao: true },
            })
        ]);
        
        const updatedAddress = await prisma.enderecos_cliente.findUnique({ where: { id: addressId }});

        return res.status(200).json({ message: 'Endereço padrão atualizado com sucesso.', address: updatedAddress });

    } catch (error) {
        console.error('Erro ao definir endereço padrão:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * @route DELETE /api/cliente/enderecos/:id
 * @description Desativa um endereço (soft delete).
 */
export const deleteAddress = async (req: Request, res: Response) => {
    const clienteId = req.user?.id;
    const addressId = parseInt(req.params.id, 10);

    if (!clienteId) {
        return res.status(401).json({ message: 'Cliente não autenticado.' });
    }

    try {
        const addressToDelete = await prisma.enderecos_cliente.findFirst({
            where: { id: addressId, id_cliente: clienteId, ativo: true }
        });
        
        if (!addressToDelete) {
            return res.status(404).json({ message: 'Endereço não encontrado ou já está inativo.' });
        }

        if (addressToDelete.padrao) {
            return res.status(400).json({ message: 'Você não pode remover seu endereço padrão. Defina outro como padrão primeiro.' });
        }

        await prisma.enderecos_cliente.update({
            where: { id: addressId },
            data: { ativo: false, padrao: false },
        });

        res.status(200).json({ message: 'Endereço removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar endereço:', error);
        res.status(500).json({ message: 'Erro interno ao deletar endereço.' });
    }
};

