// cestas-cafe/app/api/pre-check-in/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validação simples dos dados recebidos
        if (!body.guests || body.guests.length === 0 || !body.leadGuestCpf) {
            return NextResponse.json({ message: 'Dados do pré-check-in incompletos.' }, { status: 400 });
        }

        const preCheckInData = {
            ...body,
            createdAt: Timestamp.now(),
            status: 'recebido', // Um status inicial
        };

        const docRef = await adminDb.collection('pre_check_ins').add(preCheckInData);
        
        return NextResponse.json({ id: docRef.id, ...preCheckInData }, { status: 201 });

    } catch (error) {
        console.error("Erro ao salvar pré-check-in:", error);
        return NextResponse.json({ message: 'Erro ao salvar os dados.' }, { status: 500 });
    }
}