// cestas-cafe/app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { startOfToday, endOfToday } from 'date-fns';
import { Comanda, Order } from '@/types';

/**
 * Converte um objeto Timestamp do Firestore para uma string ISO de forma segura.
 * Retorna null se o valor de entrada não for um Timestamp válido.
 * @param timestamp O valor a ser convertido.
 * @returns A string ISO ou null.
 */
const toISOStringOrNull = (timestamp: any): string | null => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    // Retorna null se o campo for nulo, indefinido ou não for um objeto Timestamp.
    return null; 
};

export async function GET() {
    try {
        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        // 1. Consulta de Pedidos do Dia
        const ordersQuery = adminDb.collection("pedidos")
            .where("timestampPedido", ">=", todayStart)
            .where("timestampPedido", "<=", todayEnd)
            .where("status", "in", ["Novo", "Em Preparação"]);

        const ordersSnapshot = await ordersQuery.get();
        const pedidosDoDia = ordersSnapshot.docs.map(doc => doc.data() as Order);

        const totalCestas = pedidosDoDia.length;
        const totalPessoas = pedidosDoDia.reduce((sum, order) => sum + (order.numeroPessoas || 0), 0);
        
        // 2. Consulta de Comandas do Dia
        const comandasQuery = adminDb.collection("comandas")
            .where("createdAt", ">=", todayStart)
            .where("createdAt", "<=", todayEnd)
            .where("status", "==", "ativa")
            .orderBy("createdAt", "desc")
            .limit(10);
            
        const comandasSnapshot = await comandasQuery.get();
        const comandasDoDia = comandasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];

        // 3. Consulta de Alertas
        const alertas: string[] = [];
        const agora = Timestamp.now().toDate(); // Usando Timestamp para consistência
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

        // CORREÇÃO: Serialização segura dos dados da comanda
        const comandasDoDiaSerializaveis = comandasDoDia.map(comanda => ({
            ...comanda,
            createdAt: toISOStringOrNull(comanda.createdAt),
            horarioLimite: toISOStringOrNull(comanda.horarioLimite),
            usedAt: toISOStringOrNull(comanda.usedAt),
        }));

        return NextResponse.json({
            totalCestas,
            totalPessoas,
            comandasDoDia: comandasDoDiaSerializaveis,
            alertas
        });

    } catch (error: any) {
        console.error("ERRO NA API DO DASHBOARD:", error);

        // Se o erro for de índice faltando, a mensagem será mais clara.
        if (error.message.includes('requires an index')) {
            console.error("ERRO DE ÍNDICE NO FIRESTORE. Crie o índice composto sugerido no link do erro.");
            return NextResponse.json(
                { 
                  message: "Configuração do banco de dados necessária.",
                  details: "Uma consulta complexa no dashboard requer um índice do Firestore que não foi criado. Verifique o console do servidor (não o do navegador) para encontrar um link para criá-lo automaticamente.",
                  originalError: error.message
                }, 
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { 
              message: "Erro inesperado ao buscar dados do dashboard.",
              details: "A API encontrou um problema. Verifique os logs do servidor para mais detalhes.",
              originalError: error.message 
            }, 
            { status: 500 }
        );
    }
}