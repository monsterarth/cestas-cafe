// app/api/responses/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SurveyResponse } from '@/types/survey';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        // Extraindo 'context' do corpo da requisição
        const { surveyId, answers, context }: Omit<SurveyResponse, 'id' | 'respondedAt' | 'comandaId'> = await request.json();

        if (!surveyId || !answers || answers.length === 0) {
            return NextResponse.json({ message: 'Dados de resposta inválidos.' }, { status: 400 });
        }

        const responseRef = adminDb.collection('survey_responses').doc();
        const batch = adminDb.batch();

        const responseData = {
            surveyId,
            respondedAt: Timestamp.now(),
            // Garante que o 'context' seja salvo, mesmo que vazio
            context: context || {} 
        };
        batch.set(responseRef, responseData);

        const answersRef = responseRef.collection('answers');
        answers.forEach((answer) => {
            const answerDocRef = answersRef.doc();
            // Aqui estamos omitindo o ID do cliente, pois o Firestore gera um novo
            const { id, ...answerData } = answer;
            batch.set(answerDocRef, answerData);
        });

        await batch.commit();

        return NextResponse.json({ message: 'Respostas salvas com sucesso!', id: responseRef.id }, { status: 201 });
    } catch (error: any) {
        console.error("Erro ao salvar respostas:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}