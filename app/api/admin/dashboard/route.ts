// Arquivo: app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
// CORREÇÃO: Importando o Timestamp do SDK de Admin, que é o correto para o back-end.
import { Timestamp } from 'firebase-admin/firestore'; 
import { startOfToday, endOfToday } from 'date-fns';
import { Comanda } from '@/types';

export async function GET() {
    try {
        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        const ordersQuery = adminDb.collection("orders")
            .where("timestampPedido", ">=", todayStart)
            .where("timestampPedido", "<=", todayEnd)
            .where("status", "in", ["Novo", "Em Preparação"]);
            
        const ordersSnapshot = await ordersQuery.get();
        const pedidosDoDia = ordersSnapshot.docs.map(doc => doc.data());

        const totalCestas = pedidosDoDia.length;
        const totalPessoas = pedidosDoDia.reduce((sum, order) => sum + (order.numeroPessoas || 0), 0);

        const comandasQuery = adminDb.collection("comandas")
            .where("createdAt", ">=", todayStart)
            .where("createdAt", "<=", todayEnd)
            .where("status", "==", "ativa")
            .orderBy("createdAt", "desc")
            .limit(10);
            
        const comandasSnapshot = await comandasQuery.get();
        const comandasDoDia = comandasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];

        const alertas: string[] = [];
        const agora = new Date();
        // Adiciona um buffer de 5 minutos para a notificação
        const umaHoraDepois = new Date(agora.getTime() + 55 * 60 * 1000);

        const comandasPertoExpirarQuery = adminDb.collection("comandas")
            .where("isActive", "==", true)
            .where("horarioLimite", ">", agora)
            .where("horarioLimite", "<=", umaHoraDepois);
            
        const comandasPertoExpirarSnapshot = await comandasPertoExpirarQuery.get();
        comandasPertoExpirarSnapshot.forEach(doc => {
            const comanda = doc.data();
            alertas.push(`A comanda ${comanda.token} para ${comanda.guestName} expira em breve!`);
        });

        // Esta serialização agora funcionará corretamente com o tipo de Timestamp correto.
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
        console.error("Erro na API do Dashboard:", error);
        return NextResponse.json({ message: "Erro ao buscar dados do dashboard.", error: error.message }, { status: 500 });
    }
}