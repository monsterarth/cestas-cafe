// app/api/surveys/links/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { GeneratedSurveyLink } from '@/types/survey';

// GET: Retorna o histórico de links para uma pesquisa específica
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');

    if (!surveyId) {
        return NextResponse.json({ message: "O ID da pesquisa (surveyId) é obrigatório." }, { status: 400 });
    }

    try {
        const linksSnap = await adminDb.collection('generated_links')
            .where('surveyId', '==', surveyId)
            .orderBy('createdAt', 'desc')
            .limit(50) // Limita aos 50 mais recentes para performance
            .get();
        
        const links = linksSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            };
        });

        return NextResponse.json(links);
    } catch (error) {
        console.error("Erro ao buscar histórico de links:", error);
        return NextResponse.json({ message: 'Erro ao buscar histórico.' }, { status: 500 });
    }
}

// POST: Salva um novo link gerado no histórico
export async function POST(request: Request) {
    try {
        const body: Omit<GeneratedSurveyLink, 'id' | 'createdAt'> = await request.json();

        if (!body.surveyId || !body.fullUrl) {
            return NextResponse.json({ message: "ID da pesquisa e URL são obrigatórios." }, { status: 400 });
        }

        const newLink = {
            ...body,
            createdAt: Timestamp.now(),
        };

        const docRef = await adminDb.collection('generated_links').add(newLink);
        return NextResponse.json({ id: docRef.id, ...newLink }, { status: 201 });

    } catch (error) {
        console.error("Erro ao salvar link no histórico:", error);
        return NextResponse.json({ message: 'Erro ao salvar no histórico.' }, { status: 500 });
    }
}