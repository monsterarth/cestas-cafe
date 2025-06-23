// cestas-cafe/app/api/comandas/route.ts
'use client';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
// CORREÇÃO: Apenas Timestamp é necessário do 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore';
import type { Comanda } from '@/types';

/**
 * Converte a string de data/hora local para um Timestamp UTC correto,
 * assumindo que a string de entrada está no fuso de Brasília (GMT-3).
 * @param localDateTimeString A string de data/hora vinda do navegador.
 * @returns Um objeto Timestamp do Firestore ou undefined.
 */
const convertLocalStringToTimestamp = (localDateTimeString: string | undefined | null): Timestamp | undefined => {
    if (!localDateTimeString) {
        // CORREÇÃO: Retorna undefined em vez de null para corresponder ao tipo
        return undefined;
    }
    try {
        const isoStringWithOffset = `${localDateTimeString}:00-03:00`;
        const correctDate = new Date(isoStringWithOffset);
        if (isNaN(correctDate.getTime())) return undefined;
        return Timestamp.fromDate(correctDate);
    } catch (error) {
        console.error("Erro ao converter string de data para Timestamp:", error);
        return undefined;
    }
};

export async function POST(request: Request) {
    try {
        const { guestName, cabin, numberOfGuests, horarioLimite } = await request.json();

        if (!guestName || !cabin || !numberOfGuests) {
            return NextResponse.json({ message: "Dados incompletos para criar a comanda." }, { status: 400 });
        }

        const token = `F-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const newComandaData = {
            token,
            guestName,
            cabin,
            numberOfGuests: Number(numberOfGuests),
            isActive: true,
            status: 'ativa',
            createdAt: Timestamp.now(),
            horarioLimite: convertLocalStringToTimestamp(horarioLimite),
        };
        
        // CORREÇÃO: Usando a sintaxe correta do Admin SDK para adicionar um documento.
        // O `add` é um método da referência da coleção.
        const docRef = await adminDb.collection("comandas").add(newComandaData);
        
        // Retornamos os dados criados junto com o ID gerado.
        const responseData = { ...newComandaData, id: docRef.id };

        // É preciso converter os Timestamps do Admin para um formato serializável (ISO string)
        // para enviar como JSON de volta ao cliente sem erros.
        return NextResponse.json({
            ...responseData,
            createdAt: (responseData.createdAt as Timestamp).toDate().toISOString(),
            horarioLimite: responseData.horarioLimite ? (responseData.horarioLimite as Timestamp).toDate().toISOString() : undefined,
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erro ao criar comanda:", error);
        return NextResponse.json({ message: "Erro interno no servidor.", error: error.message }, { status: 500 });
    }
}