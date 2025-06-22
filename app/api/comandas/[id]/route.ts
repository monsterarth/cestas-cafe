// Arquivo: app/api/comandas/[id]/route.ts
import { adminDb } from '@/lib/firebase-admin'; // [CORREÇÃO] Importado como 'adminDb'
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const comandaRef = adminDb.collection('comandas').doc(params.id); // [CORREÇÃO] Usado 'adminDb'
        const body = await req.json();

        const { action, horarioLimite, mensagemAtraso } = body;

        let updateData: { [key: string]: any } = {};

        // Lógica para arquivar/reativar
        if (action === 'arquivar') {
            updateData.status = 'arquivada';
        } else if (action === 'reativar') {
            updateData.status = 'ativa';
        }

        // Lógica para atualizar a validade
        if (horarioLimite !== undefined) {
             if (horarioLimite) {
                // Converte a string de data (ex: '2024-10-26T20:00') para Timestamp
                updateData.horarioLimite = Timestamp.fromDate(new Date(horarioLimite));
            } else {
                // Se for uma string vazia, remove o campo do documento
                updateData.horarioLimite = FieldValue.delete();
            }
        }

        // Lógica para atualizar a mensagem de atraso
        if (mensagemAtraso !== undefined) {
             updateData.mensagemAtraso = mensagemAtraso;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'Nenhuma ação ou dado para atualizar foi fornecido.' }, { status: 400 });
        }
        
        await comandaRef.update(updateData);

        return NextResponse.json({ id: params.id, ...updateData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao atualizar a comanda', error: (error as Error).message }, { status: 500 });
    }
}