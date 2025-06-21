// Arquivo: app/api/comandas/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Função para gerar um token alfanumérico curto e legível
const generateToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `F-${result}`;
}

export async function POST(request: Request) {
    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }

        const { guestName, cabin, numberOfGuests } = await request.json();

        if (!guestName || !cabin || !numberOfGuests) {
            return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 });
        }

        const token = generateToken();

        const comandaData = {
            token,
            guestName,
            cabin,
            numberOfGuests: Number(numberOfGuests),
            isActive: true,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'comandas'), comandaData);

        return NextResponse.json({ id: docRef.id, ...comandaData }, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao criar comanda:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}