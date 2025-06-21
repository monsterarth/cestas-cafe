// Arquivo: app/api/cabanas/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // <-- MUDANÇA IMPORTANTE

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        const updates = await request.json();
        const docRef = adminDb.collection('cabanas').doc(id);
        await docRef.update(updates);

        return NextResponse.json({ message: 'Cabana atualizada com sucesso.' }, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao atualizar cabana ${id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        const docRef = adminDb.collection('cabanas').doc(id);
        await docRef.delete();

        return NextResponse.json({ message: 'Cabana deletada com sucesso.' }, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao deletar cabana ${id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}