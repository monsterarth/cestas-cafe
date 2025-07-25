// app/api/locations/cities/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET: Retorna uma lista de cidades filtrada por um estado específico.
 * Espera um query param `stateId`.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');

    // Validação para garantir que o ID do estado foi fornecido
    if (!stateId) {
        return NextResponse.json({ message: 'O ID do estado (stateId) é obrigatório.' }, { status: 400 });
    }

    try {
        const citiesSnap = await adminDb.collection('cities')
            .where('stateId', '==', stateId)
            .orderBy('name')
            .get();
            
        const cities = citiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(cities);
    } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        return NextResponse.json({ message: 'Erro interno do servidor ao buscar cidades.' }, { status: 500 });
    }
}

/**
 * POST: Adiciona uma nova cidade a um estado específico.
 */
export async function POST(request: Request) {
    try {
        const { name, stateId } = await request.json();

        // Validação para garantir que os dados necessários foram fornecidos
        if (!name || !stateId) {
            return NextResponse.json({ message: 'O nome da cidade e o ID do estado (stateId) são obrigatórios.' }, { status: 400 });
        }

        const docRef = await adminDb.collection('cities').add({
            name,
            stateId,
        });

        return NextResponse.json({ id: docRef.id, name, stateId }, { status: 201 });
    } catch (error) {
        console.error("Erro ao adicionar cidade:", error);
        return NextResponse.json({ message: 'Erro interno do servidor ao adicionar cidade.' }, { status: 500 });
    }
}