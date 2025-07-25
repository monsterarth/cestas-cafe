// cestas-cafe/app/api/pre-check-in/list/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const checkInsSnap = await adminDb.collection('pre_check_ins')
            .orderBy('createdAt', 'desc')
            .limit(100) // Limita aos 100 mais recentes
            .get();
        
        const checkIns = checkInsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(checkIns);
    } catch (error) {
        console.error("Erro ao buscar pré-check-ins:", error);
        return NextResponse.json({ message: 'Erro ao buscar dados.' }, { status: 500 });
    }
}