// cestas-cafe/app/api/pre-check-in/list/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { PreCheckIn } from '@/types';

// Força a rota a ser dinâmica, desativando o cache de dados da Vercel.
// Isso garante que os dados mais recentes sejam sempre buscados do banco.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const checkInsSnap = await adminDb.collection('pre_check_ins')
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get();
        
        // Mapeia os documentos para o tipo PreCheckIn, garantindo a tipagem correta
        const checkIns: PreCheckIn[] = checkInsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                leadGuestCpf: data.leadGuestCpf,
                leadGuestEmail: data.leadGuestEmail,
                leadGuestPhone: data.leadGuestPhone,
                address: data.address,
                estimatedArrivalTime: data.estimatedArrivalTime,
                foodRestrictions: data.foodRestrictions,
                isBringingPet: data.isBringingPet,
                guests: data.guests,
                status: data.status,
                // Converte o Timestamp do Firebase para uma string ISO universal
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            };
        });

        return NextResponse.json(checkIns);

    } catch (error) {
        console.error("Erro ao buscar pré-check-ins:", error);
        return NextResponse.json({ message: 'Erro ao buscar dados.' }, { status: 500 });
    }
}