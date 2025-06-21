// Arquivo: app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { startOfToday, endOfToday } from 'date-fns';
import { Comanda } from '@/types'; // <-- CORREÇÃO: Importa o tipo Comanda

export async function GET() {
    try {
        const db = await getFirebaseDb();
        if (!db) throw new Error("DB connection failed");

        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        const ordersQuery = query(
            collection(db, "orders"),
            where("timestampPedido", ">=", todayStart),
            where("timestampPedido", "<=", todayEnd),
            where("status", "in", ["Novo", "Em Preparação"])
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const pedidosDoDia = ordersSnapshot.docs.map(doc => doc.data());

        const totalCestas = pedidosDoDia.length;
        const totalPessoas = pedidosDoDia.reduce((sum, order) => sum + (order.numeroPessoas || 0), 0);

        const comandasQuery = query(
            collection(db, "comandas"),
            where("createdAt", ">=", todayStart),
            where("createdAt", "<=", todayEnd),
            where("status", "==", "ativa"),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const comandasSnapshot = await getDocs(comandasQuery);
        // CORREÇÃO: Adiciona a tipagem explícita 'as Comanda[]'
        const comandasDoDia = comandasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];

        const alertas: string[] = [];
        const agora = new Date();
        const umaHoraDepois = new Date(agora.getTime() + 60 * 60 * 1000);

        const comandasPertoExpirarQuery = query(
            collection(db, "comandas"),
            where("isActive", "==", true),
            where("horarioLimite", ">", agora),
            where("horarioLimite", "<=", umaHoraDepois)
        );
        const comandasPertoExpirarSnapshot = await getDocs(comandasPertoExpirarQuery);
        comandasPertoExpirarSnapshot.forEach(doc => {
            const comanda = doc.data();
            alertas.push(`A comanda ${comanda.token} para ${comanda.guestName} expira em breve!`);
        });

        const comandasDoDiaSerializaveis = comandasDoDia.map(comanda => ({
            ...comanda,
            createdAt: (comanda.createdAt as Timestamp).toDate().toISOString(),
            horarioLimite: comanda.horarioLimite ? (comanda.horarioLimite as Timestamp).toDate().toISOString() : null,
        }));

        return NextResponse.json({
            totalCestas,
            totalPessoas,
            comandasDoDia: comandasDoDiaSerializaveis,
            alertas
        });

    } catch (error: any) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ message: "Erro ao buscar dados do dashboard." }, { status: 500 });
    }
}