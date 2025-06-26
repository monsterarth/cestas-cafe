// cestas-cafe/app/api/comandas/[id]/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
// CORREÇÃO: Apenas Timestamp é necessário do 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Converte a string de data/hora local para um Timestamp UTC correto,
 * assumindo que a string de entrada está no fuso de Brasília (GMT-3).
 * @param localDateTimeString A string de data/hora vinda do navegador.
 * @returns Um objeto Timestamp do Firestore ou undefined.
 */
const convertLocalStringToTimestamp = (localDateTimeString: string | undefined | null): Timestamp | undefined => {
    if (!localDateTimeString) {
        // CORREÇÃO: Retorna undefined em vez de null
        return undefined;
    }
    // Uma string vazia também deve retornar undefined
    if (localDateTimeString.trim() === '') {
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

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        const body = await request.json();
        const { action, horarioLimite, mensagemAtraso } = body;

        // CORREÇÃO: Usando a sintaxe correta do Admin SDK para referenciar um documento.
        const comandaRef = adminDb.collection("comandas").doc(id);
        const comandaSnap = await comandaRef.get();

        if (!comandaSnap.exists) {
            return NextResponse.json({ message: "Comanda não encontrada." }, { status: 404 });
        }

        let updateData: { [key: string]: any } = {};

        if (action) {
            updateData.isActive = action === 'reativar';
            updateData.status = action === 'reativar' ? 'ativa' : 'arquivada';
        } else {
            if (horarioLimite !== undefined) {
                updateData.horarioLimite = convertLocalStringToTimestamp(horarioLimite);
            }
            if (mensagemAtraso !== undefined) {
                updateData.mensagemAtraso = mensagemAtraso;
            }
        }
        
        // CORREÇÃO: Usando a sintaxe correta do Admin SDK para atualizar o documento.
        await comandaRef.update(updateData);
        return NextResponse.json({ message: "Comanda atualizada com sucesso!" });

    } catch (error: any) {
        console.error(`Falha ao atualizar comanda ${id}:`, error);
        return NextResponse.json({ message: 'Erro ao atualizar a comanda', error: error.message }, { status: 500 });
    }
}