// Arquivo: app/api/comandas/[identifier]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, getDoc } from 'firebase/firestore';
import { Comanda } from '@/types';

export async function GET(request: Request, { params }: { params: { identifier: string } }) {
    const token = params.identifier;
    try {
        const comandasRef = adminDb.collection('comandas');
        const q = comandasRef.where('token', '==', token.toUpperCase()).where('isActive', '==', true).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return NextResponse.json({ message: 'Comanda inválida ou já utilizada.' }, { status: 404 });
        }
        
        const comandaDoc = querySnapshot.docs[0];
        const comandaData = { id: comandaDoc.id, ...comandaDoc.data() } as Comanda;

        if (comandaData.horarioLimite && (comandaData.horarioLimite as any).toDate) {
            const limite = (comandaData.horarioLimite as Timestamp).toDate();
            const agora = new Date();
            if (agora > limite) {
                return NextResponse.json({ 
                    expired: true, 
                    message: comandaData.mensagemAtraso || "O prazo para fazer o pedido com esta comanda já encerrou."
                }, { status: 410 });
            }
        }

        return NextResponse.json(comandaData, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: `Erro interno do servidor ao validar token. ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { identifier: string } }) {
    const id = params.identifier;
    try {
        const updates = await request.json();
        
        if (updates.horarioLimite) {
            updates.horarioLimite = new Date(updates.horarioLimite);
        }

        const docRef = adminDb.collection('comandas').doc(id);
        await docRef.update(updates);
        
        return NextResponse.json({ message: 'Comanda atualizada com sucesso.' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}