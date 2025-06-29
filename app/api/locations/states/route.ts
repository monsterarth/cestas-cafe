// app/api/locations/states/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET: Retorna estados de um país específico
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    if (!countryId) return NextResponse.json({ message: 'ID do país é obrigatório.' }, { status: 400 });

    try {
        const statesSnap = await adminDb.collection('states').where('countryId', '==', countryId).orderBy('name').get();
        const states = statesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(states);
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao buscar estados.' }, { status: 500 });
    }
}

// POST: Adiciona um novo estado
export async function POST(request: Request) {
    try {
        const { name, countryId } = await request.json();
        if (!name || !countryId) return NextResponse.json({ message: 'Nome e ID do país são obrigatórios.' }, { status: 400 });
        const docRef = await adminDb.collection('states').add({ name, countryId });
        return NextResponse.json({ id: docRef.id, name, countryId }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao adicionar estado.' }, { status: 500 });
    }
}