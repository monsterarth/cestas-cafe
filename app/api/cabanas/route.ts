// Arquivo: app/api/cabanas/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // <-- Usa o Admin SDK
import { Cabin } from '@/types';

export async function GET() {
    try {
        const cabanasRef = adminDb.collection('cabanas');
        const snapshot = await cabanasRef.orderBy('name', 'asc').get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const cabanas: Cabin[] = [];
        snapshot.forEach(doc => {
            cabanas.push({ id: doc.id, ...doc.data() } as Cabin);
        });
        
        return NextResponse.json(cabanas);

    } catch (error: any) {
        console.error("Erro ao buscar cabanas na API (Admin):", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newCabin: Partial<Cabin> = await request.json();
        if (!newCabin.name || !newCabin.capacity) {
            return NextResponse.json({ message: 'Nome e capacidade são obrigatórios.' }, { status: 400 });
        }

        const docRef = await adminDb.collection('cabanas').add(newCabin);
        return NextResponse.json({ id: docRef.id, ...newCabin }, { status: 201 });
    
    } catch (error: any) {
        console.error("Erro ao criar cabana na API (Admin):", error);
        return NextResponse.json({ message: `Falha ao criar cabana: ${error.message}` }, { status: 500 });
    }
}