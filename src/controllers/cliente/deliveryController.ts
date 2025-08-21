// src/controllers/cliente/deliveryController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import { Day, parse, isWithinInterval, setHours, setMinutes, setSeconds } from 'date-fns';

// --- Tipos e Helpers ---
type Horario = { [key: string]: string[] }; // Ex: { seg: ["09:00-18:00"], ... }

const toNum = (v: any): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// [CORREÇÃO] Adicionada a função 'money' que estava faltando
const money = (n: any) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const haversineDistance = `
  6371 * acos(
    cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
    sin(radians($1)) * sin(radians(latitude))
  )
`;

const dayMapping: { [key: string]: Day } = {
    dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6
};

const dayNames: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
};

/**
 * Verifica se a loja está aberta no momento atual.
 */
const checkIfStoreIsOpen = (horarios: Horario, now: Date): boolean => {
    const dayOfWeek = now.getDay();
    const dayKey = Object.keys(dayMapping).find(key => dayMapping[key] === dayOfWeek);
    if (!dayKey || !horarios[dayKey]) return false; // Fechado se não há horário para o dia

    const intervals = horarios[dayKey];
    for (const interval of intervals) {
        const [startStr, endStr] = interval.split('-');
        const start = parse(startStr, 'HH:mm', new Date());
        const end = parse(endStr, 'HH:mm', new Date());
        
        const checkStart = setSeconds(setMinutes(setHours(now, start.getHours()), start.getMinutes()), 0);
        const checkEnd = setSeconds(setMinutes(setHours(now, end.getHours()), end.getMinutes()), 0);

        if (isWithinInterval(now, { start: checkStart, end: checkEnd })) {
            return true;
        }
    }
    return false;
};

/**
 * Encontra o próximo dia e horário de funcionamento.
 */
const findNextOpeningTime = (horarios: Horario, now: Date): string => {
    for (let i = 0; i < 7; i++) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + i);
        const dayOfWeek = nextDate.getDay();
        const dayKey = Object.keys(dayMapping).find(key => dayMapping[key] === dayOfWeek);

        if (dayKey && horarios[dayKey] && horarios[dayKey].length > 0) {
            const firstInterval = horarios[dayKey][0];
            const [startTime] = firstInterval.split('-');
            const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[dayOfWeek];
            return `${dayName} às ${startTime}`;
        }
    }
    return 'Consulte os horários da loja';
};


// ===================================================
// POST /api/cliente/delivery/calculate
// ===================================================
export async function calculateDelivery(req: Request, res: Response) {
    const { lat, lng, itemsByStore } = req.body;

    if (!lat || !lng) return res.status(400).json({ error: 'Latitude e longitude do cliente são obrigatórias.' });
    if (!itemsByStore || typeof itemsByStore !== 'object' || Object.keys(itemsByStore).length === 0) {
        return res.status(400).json({ error: 'É necessário fornecer os itens agrupados por loja.' });
    }

    const clientLat = toNum(lat);
    const clientLng = toNum(lng);
    const storeIds = Object.keys(itemsByStore);

    try {
        const sql = `
            SELECT
                id, nome, aceita_entrega_expressa, raio_entrega_km,
                taxa_entrega_fixa, taxa_entrega_por_km, tempo_preparo_minutos,
                horario_funcionamento, pedido_minimo_entrega, frete_gratis_acima_de,
                aceitando_pedidos_online,
                (${haversineDistance}) AS distance_km
            FROM lojas
            WHERE id = ANY($3::int[]) AND ativo = true;
        `;

        const { rows: stores } = await pool.query(sql, [clientLat, clientLng, storeIds]);
        const now = new Date(); // Pega a data/hora atual do servidor

        const deliveryOptions = stores.map(store => {
            const storeSubtotal = toNum(itemsByStore[store.id].subtotal) || 0;

            // 1. Verificação de Emergência
            if (!store.aceitando_pedidos_online) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'STORE_PAUSED', message: 'Esta loja não está aceitando pedidos no momento.' };
            }

            // 2. Verificação de Distância
            const distance = store.distance_km;
            if (!store.aceita_entrega_expressa || distance > store.raio_entrega_km) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'OUT_OF_RANGE', message: 'Esta loja não entrega no seu endereço.' };
            }

            // 3. Verificação de Horário de Funcionamento
            const isOpen = checkIfStoreIsOpen(store.horario_funcionamento, now);
            
            // 4. Verificação de Pedido Mínimo
            if (store.pedido_minimo_entrega > 0 && storeSubtotal < store.pedido_minimo_entrega) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'MINIMUM_NOT_MET', message: `O pedido mínimo desta loja é de ${money(store.pedido_minimo_entrega)}.` };
            }

            // 5. Cálculo de Frete e Promoção
            let deliveryFee = Number(store.taxa_entrega_fixa) + (Number(store.taxa_entrega_por_km) * distance);
            let feeMessage = null;
            if (store.frete_gratis_acima_de && storeSubtotal >= store.frete_gratis_acima_de) {
                deliveryFee = 0;
                feeMessage = "Frete Grátis!";
            }
            
            // 6. Cálculo do Tempo de Entrega
            const deliveryTimeMinutes = store.tempo_preparo_minutos + Math.round(distance * 5);
            let estimatedTime = `${deliveryTimeMinutes}-${deliveryTimeMinutes + 15} min`;
            let isScheduled = false;

            if (!isOpen) {
                estimatedTime = `Envio agendado para ${findNextOpeningTime(store.horario_funcionamento, now)}`;
                isScheduled = true;
            }

            return {
                storeId: store.id,
                storeName: store.nome,
                available: true,
                isScheduled,
                fee: deliveryFee.toFixed(2),
                feeMessage,
                estimatedTime,
                distance: distance.toFixed(1),
            };
        });

        return res.json(deliveryOptions);

    } catch (err) {
        console.error('calculateDelivery ->', err);
        return res.status(500).json({ error: 'Erro ao calcular o frete.' });
    }
}
