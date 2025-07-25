// cestas-cafe/app/api/estoque/pedidos/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface RequestBody {
    items: { [supplierId: string]: { [itemId: string]: number } };
}

export async function POST(request: Request) {
    try {
        const body: RequestBody = await request.json();

        if (!body.items || Object.keys(body.items).length === 0) {
            return NextResponse.json({ message: 'Nenhum item no pedido.' }, { status: 400 });
        }

        const newOrder = {
            createdAt: Timestamp.now(),
            status: 'solicitado', // um status inicial para o pedido
            orderData: body.items     // Salva os dados brutos do pedido
        };

        await adminDb.collection('pedidos_estoque').add(newOrder);

        return NextResponse.json({ message: 'Pedido criado com sucesso' }, { status: 201 });

    } catch (error) {
        console.error("Erro ao salvar pedido de estoque:", error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}