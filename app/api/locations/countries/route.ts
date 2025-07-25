// app/api/locations/countries/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET: Retorna todos os países
export async function GET() {
    try {
        const countriesSnap = await adminDb.collection('countries').orderBy('name').get();
        const countries = countriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(countries);
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao buscar países.' }, { status: 500 });
    }
}

// POST: Adiciona um novo país
export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) return NextResponse.json({ message: 'Nome do país é obrigatório.' }, { status: 400 });
        const docRef = await adminDb.collection('countries').add({ name });
        return NextResponse.json({ id: docRef.id, name }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao adicionar país.' }, { status: 500 });
    }
}