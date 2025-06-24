import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Comanda } from '@/types';

// Readicionando o handler GET funcional
export async function GET() {
    try {
        const comandasRef = adminDb.collection('comandas');
        const q = comandasRef.orderBy('createdAt', 'desc');

        const snapshot = await q.get();
        const comandas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comanda[];
        
        // Garante que todos os timestamps sejam strings antes de enviar
        const serializableComandas = comandas.map(comanda => ({
            ...comanda,
            createdAt: (comanda.createdAt as unknown as Timestamp).toDate().toISOString(),
            horarioLimite: comanda.horarioLimite ? (comanda.horarioLimite as unknown as Timestamp).toDate().toISOString() : null,
            usedAt: comanda.usedAt ? (comanda.usedAt as unknown as Timestamp).toDate().toISOString() : null,
        }));

        return NextResponse.json(serializableComandas, { status: 200 });

    } catch (error: any) {
        console.error('Erro ao buscar comandas:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.', error: error.message }, { status: 500 });
    }
}


// Versão final e funcional do handler POST
export async function POST(request: Request) {
    try {
        const { guestName, cabin, numberOfGuests, horarioLimite, mensagemAtraso } = await request.json();

        if (!guestName || !cabin || !numberOfGuests) {
            return NextResponse.json({ message: 'Dados do hóspede, cabana e n° de pessoas são obrigatórios.' }, { status: 400 });
        }

        const token = `F-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // 1. Prepara o objeto para o Firestore (com tipos complexos)
        const dataForFirestore: any = {
            token,
            guestName,
            cabin,
            numberOfGuests: Number(numberOfGuests),
            isActive: true,
            status: 'ativa',
            createdAt: FieldValue.serverTimestamp(),
        };

        if (horarioLimite && horarioLimite !== '') {
            dataForFirestore.horarioLimite = new Date(horarioLimite);
        }
        if (mensagemAtraso) {
            dataForFirestore.mensagemAtraso = mensagemAtraso;
        }

        // 2. Salva no banco de dados
        const docRef = await adminDb.collection('comandas').add(dataForFirestore);

        // 3. Monta a resposta do zero, usando apenas dados seguros (primitivos)
        const responseData = {
            id: docRef.id,
            token: token,
            guestName: guestName,
            cabin: cabin,
            numberOfGuests: Number(numberOfGuests),
            isActive: true,
            status: 'ativa',
            createdAt: new Date().toISOString(),
            horarioLimite: horarioLimite || null,
            mensagemAtraso: mensagemAtraso || null
        };

        // 4. Retorna a resposta segura
        return NextResponse.json(responseData, { status: 201 });

    } catch (error: any) {
        console.error("Erro ao criar comanda:", error);
        return NextResponse.json({ message: "Erro interno no servidor.", error: error.message }, { status: 500 });
    }
}