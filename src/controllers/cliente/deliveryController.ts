// src/controllers/cliente/deliveryController.ts
import { Request, Response } from 'express';
import { pool } from '../../database/connection';
import { Day, parse, isWithinInterval, setHours, setMinutes, setSeconds } from 'date-fns';

// --- Tipos e Helpers ---
type Horario = { [key: string]: string[] };

const toNum = (v: any): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const money = (n: any) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dayMapping: { [key: string]: Day } = {
    dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6
};

const dayNames: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
};

const checkIfStoreIsOpen = (horarios: Horario, now: Date): boolean => {
    if (!horarios) return false;
    const dayOfWeek = now.getDay();
    const dayKey = Object.keys(dayMapping).find(key => dayMapping[key] === dayOfWeek);
    if (!dayKey || !horarios[dayKey]) return false;

    const intervals = horarios[dayKey];
    for (const interval of intervals) {
        const [startStr, endStr] = interval.split('-');
        if (!startStr || !endStr) continue;
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

const findNextOpeningTime = (horarios: Horario, now: Date): string => {
    if (!horarios) return 'Consulte os horários da loja';
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
    const { lat, lng, latitude, longitude, itemsByStore } = req.body;
    console.log('[calculateDelivery] Body recebido:', req.body);

    const clientLatNum = toNum(lat) ?? toNum(latitude);
    const clientLngNum = toNum(lng) ?? toNum(longitude);

    if (clientLatNum === null || clientLngNum === null) {
        return res.status(400).json({ error: 'Latitude e longitude do cliente são obrigatórias.' });
    }
    if (!itemsByStore || typeof itemsByStore !== 'object' || Object.keys(itemsByStore).length === 0) {
        return res.status(400).json({ error: 'É necessário fornecer os itens agrupados por loja.' });
    }

    const storeIds = Object.keys(itemsByStore);

    try {
        const sql = `
            SELECT
                id, nome, aceita_entrega_expressa, raio_entrega_km,
                taxa_entrega_fixa, taxa_entrega_por_km, tempo_preparo_minutos,
                horario_funcionamento, pedido_minimo_entrega, frete_gratis_acima_de,
                aceitando_pedidos_online, latitude, longitude
            FROM lojas
            WHERE id = ANY($1::int[]) AND ativo = true;
        `;

        const { rows: stores } = await pool.query(sql, [storeIds]);
        
        if (stores.length === 0) {
            return res.json([]);
        }

        const now = new Date();

        const deliveryOptions = stores.map(store => {
            if (store.latitude === null || store.longitude === null) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'STORE_NO_LOCATION', message: 'Esta loja não tem uma localização definida.' };
            }

            const storeSubtotal = toNum(itemsByStore[store.id].subtotal) || 0;

            // ✅ CORREÇÃO MATEMÁTICA FINAL
            // Garante que o valor passado para acos() esteja sempre entre -1 e 1.
            const acosValue = Math.sin((clientLatNum * Math.PI) / 180) * Math.sin((store.latitude * Math.PI) / 180) +
                            Math.cos((clientLatNum * Math.PI) / 180) * Math.cos((store.latitude * Math.PI) / 180) *
                            Math.cos(((store.longitude * Math.PI) / 180) - ((clientLngNum * Math.PI) / 180));
            const distance = 6371 * Math.acos(Math.max(-1, Math.min(1, acosValue)));


            if (!store.aceitando_pedidos_online) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'STORE_PAUSED', message: 'Esta loja não está aceitando pedidos no momento.' };
            }

            if (isNaN(distance) || !store.aceita_entrega_expressa || distance > store.raio_entrega_km) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'OUT_OF_RANGE', message: 'Esta loja não entrega no seu endereço.' };
            }
            
            if (store.pedido_minimo_entrega > 0 && storeSubtotal < store.pedido_minimo_entrega) {
                return { storeId: store.id, storeName: store.nome, available: false, reason: 'MINIMUM_NOT_MET', message: `O pedido mínimo desta loja é de ${money(store.pedido_minimo_entrega)}.` };
            }

            const isOpen = checkIfStoreIsOpen(store.horario_funcionamento, now);
            
            let deliveryFee = Number(store.taxa_entrega_fixa) + (Number(store.taxa_entrega_por_km) * distance);
            let feeMessage = null;
            if (store.frete_gratis_acima_de && storeSubtotal >= store.frete_gratis_acima_de) {
                deliveryFee = 0;
                feeMessage = "Frete Grátis!";
            }
            
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

        console.log('[calculateDelivery] Opções de entrega calculadas:', deliveryOptions);
        return res.json(deliveryOptions);

    } catch (err) {
        console.error('[calculateDelivery] Erro na execução:', err);
        return res.status(500).json({ error: 'Erro ao calcular o frete.' });
    }
}
