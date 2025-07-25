// app/api/surveys/[surveyId]/questions/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Question } from '@/types/survey';

// POST: Adiciona uma nova pergunta a uma pesquisa
export async function POST(request: Request, { params }: { params: { surveyId: string } }) {
    try {
        const questionData: Omit<Question, 'id'> = await request.json();
        if (!questionData.text || !questionData.type || !questionData.category) {
            return NextResponse.json({ message: 'Dados da pergunta incompletos.' }, { status: 400 });
        }
        const questionsRef = adminDb.collection('surveys').doc(params.surveyId).collection('questions'); // USA surveyId
        const docRef = await questionsRef.add(questionData);
        return NextResponse.json({ id: docRef.id, ...questionData }, { status: 201 });
    } catch (error: any) {
        console.error(`Erro ao adicionar pergunta à pesquisa ${params.surveyId}:`, error); // USA surveyId
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}