// cestas-cafe/app/api/admin/stats/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, Query, CollectionReference } from 'firebase-admin/firestore';
// Importando os tipos corretos do seu projeto
import { Order, ItemPedido } from '@/types'; 
import { endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        
        let query: Query | CollectionReference = adminDb.collection("pedidos");

        if (startDateParam && endDateParam) {
            const startDate = parseISO(startDateParam);
            const endDate = endOfDay(parseISO(endDateParam));

            query = query
                .where("timestampPedido", ">=", Timestamp.fromDate(startDate))
                .where("timestampPedido", "<=", Timestamp.fromDate(endDate));
        }

        const ordersSnapshot = await query.get();

        if (ordersSnapshot.empty) {
            return NextResponse.json({
                totalPedidos: 0,
                totalItensVendidos: 0,
                itensMaisPedidos: [],
                pratosQuentesMaisPedidos: [],
                saboresMaisPedidos: [], // Alterado de acompanhamentos para sabores
                categoriasMaisConsumidas: [],
            });
        }

        const allOrders = ordersSnapshot.docs.map(doc => doc.data() as Order);

        const itemCounts: { [key: string]: number } = {};
        const pratosQuentesCounts: { [key: string]: number } = {};
        const saboresCounts: { [key: string]: number } = {}; // Nova agregação para sabores
        const categoriaCounts: { [key: string]: number } = {};
        let totalItensVendidos = 0;

        allOrders.forEach(order => {
            // Usando o tipo 'ItemPedido' correto
            order.itensPedido?.forEach((item: ItemPedido) => {
                const itemName = item.nomeItem || 'Item Desconhecido';
                const quantity = item.quantidade || 1;

                totalItensVendidos += quantity;
                itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;

                const categoria = item.categoria || 'Sem Categoria';
                categoriaCounts[categoria] = (categoriaCounts[categoria] || 0) + quantity;

                // A categoria 'Pratos Quentes' agora vem do seu tipo de dados
                if (item.categoria === 'Pratos Quentes') {
                    pratosQuentesCounts[itemName] = (pratosQuentesCounts[itemName] || 0) + quantity;
                }

                // Usando o campo 'sabor' que existe no seu 'ItemPedido'
                if (item.sabor) {
                    saboresCounts[item.sabor] = (saboresCounts[item.sabor] || 0) + quantity;
                }
            });
        });

        const sortAndSlice = (data: { [key: string]: number }, limit = 10) => {
            return Object.entries(data)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        };
        
        const itensMaisPedidos = sortAndSlice(itemCounts, 10);
        const pratosQuentesMaisPedidos = sortAndSlice(pratosQuentesCounts, 5);
        const saboresMaisPedidos = sortAndSlice(saboresCounts, 5);
        const categoriasMaisConsumidas = sortAndSlice(categoriaCounts, 5);

        return NextResponse.json({
            totalPedidos: allOrders.length,
            totalItensVendidos,
            itensMaisPedidos,
            pratosQuentesMaisPedidos,
            saboresMaisPedidos, // Enviando os dados de sabores
            categoriasMaisConsumidas
        });

    } catch (error: any) {
        console.error("Stats API error:", error);
        return NextResponse.json({ message: "Erro ao buscar dados de estatísticas.", error: error.message }, { status: 500 });
    }
}