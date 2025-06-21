// Arquivo: app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { Order } from '@/types';

export async function GET() {
    try {
        const db = await getFirebaseDb();
        if (!db) throw new Error("DB connection failed");

        const ordersQuery = query(collection(db, "orders"));
        const ordersSnapshot = await getDocs(ordersQuery);
        const allOrders = ordersSnapshot.docs.map(doc => doc.data() as Order);

        // KPI 1: Pratos Quentes mais populares
        const pratosQuentesCount: { [key: string]: number } = {};
        allOrders.forEach(order => {
            order.itensPedido?.forEach(item => {
                if (item.categoria === 'Prato Quente' && item.nomeItem) {
                    pratosQuentesCount[item.nomeItem] = (pratosQuentesCount[item.nomeItem] || 0) + 1;
                }
            });
        });
        const pratosPopulares = Object.entries(pratosQuentesCount)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a, b) => b.value - a.value);

        // KPI 2: Horários de entrega mais comuns
        const horariosCount: { [key: string]: number } = {};
        allOrders.forEach(order => {
            if (order.horarioEntrega) {
                horariosCount[order.horarioEntrega] = (horariosCount[order.horarioEntrega] || 0) + 1;
            }
        });
        const horariosPopulares = Object.entries(horariosCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name));
            
        // KPI 3: Total de pedidos
        const totalPedidos = allOrders.length;


        return NextResponse.json({
            totalPedidos,
            pratosPopulares,
            horariosPopulares
        });

    } catch (error: any) {
        console.error("Stats API error:", error);
        return NextResponse.json({ message: "Erro ao buscar dados de estatísticas." }, { status: 500 });
    }
}