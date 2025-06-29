// app/api/responses/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SurveyResponse, Answer } from '@/types/survey';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        // ATUALIZAÇÃO: Extraindo o 'context' do corpo da requisição
        const { surveyId, comandaId, answers, context }: Omit<SurveyResponse, 'id' | 'respondedAt'> = await request.json();

        if (!surveyId || !answers || answers.length === 0) {
            return NextResponse.json({ message: 'Dados de resposta inválidos.' }, { status: 400 });
        }

        const responseRef = adminDb.collection('survey_responses').doc();
        const batch = adminDb.batch();

        const responseData = {
            surveyId,
            comandaId: comandaId || null,
            respondedAt: Timestamp.now(),
            context: context || {} // Salva o contexto no documento
        };
        batch.set(responseRef, responseData);

        const answersRef = responseRef.collection('answers');
        answers.forEach((answer: Answer) => {
            const answerDocRef = answersRef.doc();
            batch.set(answerDocRef, answer);
        });

        await batch.commit();

        return NextResponse.json({ message: 'Respostas salvas com sucesso!', id: responseRef.id }, { status: 201 });
    } catch (error: any) {
        console.error("Erro ao salvar respostas:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}