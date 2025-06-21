// Arquivo: app/api/comandas/[token]/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Comanda } from '@/types';

export async function GET(request: Request, { params }: { params: { token: string } }) {
    const token = params.token;

    if (!token) {
        return NextResponse.json({ message: 'Token não fornecido.' }, { status: 400 });
    }

    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }

        const comandasRef = collection(db, 'comandas');
        const q = query(
            comandasRef,
            where('token', '==', token.toUpperCase()),
            where('isActive', '==', true),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: 'Comanda inválida ou já utilizada.' }, { status: 404 });
        }
        
        const comandaDoc = querySnapshot.docs[0];
        const comandaData = { id: comandaDoc.id, ...comandaDoc.data() } as Comanda;

        return NextResponse.json(comandaData, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao validar comanda ${token}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}