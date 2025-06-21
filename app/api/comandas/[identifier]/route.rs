// Arquivo: app/api/comandas/[identifier]/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Comanda } from '@/types';

/**
 * Lida com a validação de uma comanda por TOKEN.
 * Usado pelo hóspede para autenticar.
 */
export async function GET(request: Request, { params }: { params: { identifier: string } }) {
    const token = params.identifier; // Aqui, o identifier é o TOKEN

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

        if (comandaData.horarioLimite && comandaData.horarioLimite.seconds) {
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
        console.error(`Erro ao validar comanda ${token}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}

/**
 * Lida com a atualização de uma comanda por ID.
 * Usado pelo painel de gerenciamento do admin.
 */
export async function PATCH(request: Request, { params }: { params: { identifier: string } }) {
    const id = params.identifier; // Aqui, o identifier é o ID do documento

    if (!id) {
        return NextResponse.json({ message: 'ID da comanda não fornecido.' }, { status: 400 });
    }

    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }

        const updates = await request.json();
        
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