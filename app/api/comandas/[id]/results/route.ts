// app/api/surveys/[id]/results/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Answer } from '@/types/survey';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!params.id || !startDateParam || !endDateParam) {
            return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
        }

        let responsesQuery = adminDb.collection('survey_responses')
            .where('surveyId', '==', params.id)
            .where('respondedAt', '>=', Timestamp.fromDate(new Date(startDateParam)))
            .where('respondedAt', '<=', Timestamp.fromDate(new Date(endDateParam)));

        const responsesSnapshot = await responsesQuery.get();

        // Define a estrutura de um resultado vazio.
        const emptyResults = {
            totalResponses: 0,
            overallAverage: 0,
            averageByCategory: [],
            textFeedback: [],
        };

        // CORREÇÃO: Se não houver respostas, retorna o objeto vazio com a estrutura correta.
        if (responsesSnapshot.empty) {
            return NextResponse.json(emptyResults);
        }

        let totalRating = 0;
        let ratingCount = 0;
        const categoryRatings: { [key: string]: { total: number; count: number } } = {};
        const textFeedback: string[] = [];
        const allAnswerPromises: Promise<void>[] = [];

        responsesSnapshot.forEach(responseDoc => {
            // Coleta todas as promessas de busca das subcoleções de respostas
            const promise = responseDoc.ref.collection('answers').get().then(answersSnapshot => {
                answersSnapshot.forEach(answerDoc => {
                    const answer = answerDoc.data() as Answer;
                    
                    if (answer.question_type_snapshot === 'RATING' && typeof answer.value === 'number') {
                        const rating = answer.value;
                        totalRating += rating;
                        ratingCount++;

                        const category = answer.question_category_snapshot;
                        if (!categoryRatings[category]) {
                            categoryRatings[category] = { total: 0, count: 0 };
                        }
                        categoryRatings[category].total += rating;
                        categoryRatings[category].count++;
                    } else if (answer.question_type_snapshot === 'TEXT') {
                        textFeedback.push(String(answer.value));
                    }
                });
            });
            allAnswerPromises.push(promise);
        });

        // Espera todas as buscas nas subcoleções terminarem
        await Promise.all(allAnswerPromises);
        
        const averageByCategory = Object.entries(categoryRatings).map(([category, data]) => ({
            category,
            average: data.count > 0 ? data.total / data.count : 0,
        }));

        const results = {
            totalResponses: responsesSnapshot.size,
            overallAverage: ratingCount > 0 ? totalRating / ratingCount : 0,
            averageByCategory,
            textFeedback,
        };

        return NextResponse.json(results);

    } catch (error: any) {
        console.error(`Erro ao agregar resultados para pesquisa ${params.id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}