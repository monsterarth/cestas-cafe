// Arquivo: app/api/comandas/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Comanda } from '@/types';
import { adminDb } from '@/lib/firebase-admin';

const generateToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `F-${result}`;
}

// Para o painel de gerenciamento
export async function GET() {
    try {
        // Usa o Admin SDK para ter acesso privilegiado
        const comandasRef = adminDb.collection('comandas');
        
        // CORREÇÃO: Consulta ultra simplificada para garantir que funcione sem índices manuais.
        // Apenas ordena pelas mais recentes. O filtro de "status" será feito no frontend.
        const q = comandasRef.orderBy('createdAt', 'desc');

        const snapshot = await q.get();
        const comandas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];

        return NextResponse.json(comandas, { status: 200 });

    } catch (error: any) {
        console.error('Erro ao buscar comandas:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}

// Para a página de criar comanda
export async function POST(request: Request) {
    try {
        const { guestName, cabin, numberOfGuests, horarioLimite, mensagemAtraso } = await request.json();

        if (!guestName || !cabin || !numberOfGuests) {
            return NextResponse.json({ message: 'Dados do hóspede, cabana e n° de pessoas são obrigatórios.' }, { status: 400 });
        }

        const token = generateToken();

        const comandaData: any = {
            token,
            guestName,
            cabin,
            numberOfGuests: Number(numberOfGuests),
            isActive: true,
            status: 'ativa',
            createdAt: serverTimestamp(),
        };

        if (horarioLimite) {
            comandaData.horarioLimite = new Date(horarioLimite);
        }
        if (mensagemAtraso) {
            comandaData.mensagemAtraso = mensagemAtraso;
        }

        const docRef = await adminDb.collection('comandas').add(comandaData);

        return NextResponse.json({ id: docRef.id, ...comandaData }, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao criar comanda:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}