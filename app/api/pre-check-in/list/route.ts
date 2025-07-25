import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Garante que a rota sempre buscará os dados mais recentes, sem cache.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const checkInsSnap = await adminDb.collection('pre_check_ins')
            .orderBy('createdAt', 'desc')
            .limit(100) // Limita aos 100 mais recentes
            .get();
        
        const checkIns = checkInsSnap.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;

            // Converte o Timestamp do Firebase para um formato de texto (ISO String)
            // que pode ser facilmente usado no lado do cliente.
            const formattedCreatedAt = createdAt instanceof Timestamp 
                ? createdAt.toDate().toISOString() 
                : null;

            return {
                id: doc.id,
                ...data,
                createdAt: formattedCreatedAt, // Substitui o objeto Timestamp pelo texto formatado
            };
        });

        return NextResponse.json(checkIns);
    } catch (error) {
        console.error("Erro ao buscar pré-check-ins:", error);
        return NextResponse.json({ message: 'Erro ao buscar dados.' }, { status: 500 });
    }
}
