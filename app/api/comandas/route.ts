// Arquivo: app/api/comandas/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Comanda } from '@/types';

const generateToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `F-${result}`;
}

export async function GET() {
    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }
        
        const comandasRef = collection(db, 'comandas');
        
        // CORREÇÃO: Consulta simplificada para evitar a necessidade de um índice composto manual.
        // Busca apenas comandas ativas e ordena pelas mais recentes.
        const q = query(comandasRef, where('status', '==', 'ativa'), orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);
        const comandas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];

        return NextResponse.json(comandas, { status: 200 });

    } catch (error: any) {
        console.error('Erro ao buscar comandas:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const db = await getFirebaseDb();
        if (!db) {
            return NextResponse.json({ message: 'Conexão com banco de dados falhou.' }, { status: 500 });
        }

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

        const docRef = await addDoc(collection(db, 'comandas'), comandaData);

        return NextResponse.json({ id: docRef.id, ...comandaData }, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao criar comanda:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}