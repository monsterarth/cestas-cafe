// Arquivo: app/api/comandas/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        const updates = await request.json();
        
        // Converte a string de data vinda do cliente para um objeto Date
        if (updates.horarioLimite === null) {
            // Permite apagar a data
            updates.horarioLimite = null;
        } else if (updates.horarioLimite) {
            updates.horarioLimite = new Date(updates.horarioLimite);
        }

        const docRef = adminDb.collection('comandas').doc(id);
        await docRef.update(updates);
        
        return NextResponse.json({ message: 'Comanda atualizada com sucesso.' }, { status: 200 });
    } catch (error: any) {
        console.error(`Erro ao atualizar comanda ${id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}