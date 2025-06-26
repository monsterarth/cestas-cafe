// app/api/surveys/[id]/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Answer } from '@/types/survey';

// GET: Agrega os resultados de uma pesquisa
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        let responsesQuery = adminDb.collection('survey_responses').where('surveyId', '==', params.id);
        
        if (startDateParam && endDateParam) {
            responsesQuery = responsesQuery
                .where('respondedAt', '>=', Timestamp.fromDate(new Date(startDateParam)))
                .where('respondedAt', '<=', Timestamp.fromDate(new Date(endDateParam)));
        }

        const responsesSnapshot = await responsesQuery.get();
        if (responsesSnapshot.empty) {
            return NextResponse.json({ message: 'Nenhum resultado encontrado para esta pesquisa.' });
        }

        let totalRating = 0;
        let ratingCount = 0;
        const categoryRatings: { [key: string]: { total: number; count: number } } = {};
        const textFeedback: string[] = [];

        for (const responseDoc of responsesSnapshot.docs) {
            const answersSnapshot = await responseDoc.ref.collection('answers').get();
            answersSnapshot.forEach(answerDoc => {
                const answer = answerDoc.data() as Answer;
                if (answer.question_type_snapshot === 'RATING') {
                    const rating = Number(answer.value);
                    if (!isNaN(rating)) {
                        totalRating += rating;
                        ratingCount++;
                        const category = answer.question_category_snapshot;
                        if (!categoryRatings[category]) {
                            categoryRatings[category] = { total: 0, count: 0 };
                        }
                        categoryRatings[category].total += rating;
                        categoryRatings[category].count++;
                    }
                } else if (answer.question_type_snapshot === 'TEXT') {
                    textFeedback.push(String(answer.value));
                }
            });
        }
        
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