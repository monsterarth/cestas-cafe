// Arquivo: app/api/comandas/[id]/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Comanda } from '@/types';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    if (!id) {
        return NextResponse.json({ message: 'ID da comanda não fornecido.' }, { status: 400 });
    }

    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }

        const updates = await request.json();
        
        // Converte string de data para objeto Date, se necessário
        if (updates.horarioLimite) {
            updates.horarioLimite = new Date(updates.horarioLimite);
        }

        const comandaRef = doc(db, 'comandas', id);
        await updateDoc(comandaRef, updates);

        const updatedDoc = await getDoc(comandaRef);
        
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() } as Comanda, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao atualizar comanda ${id}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}