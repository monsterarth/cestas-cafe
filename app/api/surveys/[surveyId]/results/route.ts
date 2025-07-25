// app/api/surveys/[surveyId]/results/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
<<<<<<< HEAD
import { Answer } from '@/types/survey';
// ATUALIZAÇÃO: Importar 'startOfDay' e 'endOfDay' para manipular as datas corretamente.
import { startOfDay, endOfDay, parseISO } from 'date-fns';
=======
import { Answer, SurveyResponse } from '@/types/survey';
import { startOfDay, endOfDay, parseISO, format as formatDate } from 'date-fns';
>>>>>>> codigo-novo/main

export async function GET(request: NextRequest, { params }: { params: { surveyId: string } }) {
    try {
        const { searchParams } = new URL(request.url);
<<<<<<< HEAD
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!params.surveyId || !startDateParam || !endDateParam) {
            return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });
        }

        // CORREÇÃO: Usar helpers para garantir que o período cubra os dias inteiros.
        const startDate = startOfDay(parseISO(startDateParam));
        const endDate = endOfDay(parseISO(endDateParam));

        let responsesQuery = adminDb.collection('survey_responses')
=======
        
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const cabinName = searchParams.get('cabana');
        const country = searchParams.get('pais');
        const state = searchParams.get('estado');
        const city = searchParams.get('cidade');

        if (!params.surveyId || !startDateParam || !endDateParam) {
            return NextResponse.json({ message: "Parâmetros de data são obrigatórios." }, { status: 400 });
        }

        const startDate = startOfDay(parseISO(startDateParam));
        const endDate = endOfDay(parseISO(endDateParam));

        const responsesQuery = adminDb.collection('survey_responses')
>>>>>>> codigo-novo/main
            .where('surveyId', '==', params.surveyId)
            .where('respondedAt', '>=', Timestamp.fromDate(startDate))
            .where('respondedAt', '<=', Timestamp.fromDate(endDate));

        const responsesSnapshot = await responsesQuery.get();
<<<<<<< HEAD
        const emptyResults = { totalResponses: 0, overallAverage: 0, averageByCategory: [], textFeedback: [] };
        if (responsesSnapshot.empty) { return NextResponse.json(emptyResults); }

        let totalRating = 0, ratingCount = 0;
        const categoryRatings: { [key: string]: { total: number; count: number } } = {};
        const textFeedback: string[] = [];
        const allAnswerPromises: Promise<void>[] = [];
        responsesSnapshot.forEach(responseDoc => {
            const promise = responseDoc.ref.collection('answers').get().then(answersSnapshot => {
                answersSnapshot.forEach(answerDoc => {
                    const answer = answerDoc.data() as Answer;
                    if (answer.question_type_snapshot === 'RATING' && typeof answer.value === 'number') {
                        totalRating += answer.value;
                        ratingCount++;
                        const category = answer.question_category_snapshot;
                        if (!categoryRatings[category]) { categoryRatings[category] = { total: 0, count: 0 }; }
                        categoryRatings[category].total += answer.value;
                        categoryRatings[category].count++;
                    } else if (answer.question_type_snapshot === 'TEXT') {
                        textFeedback.push(String(answer.value));
                    }
                });
            });
            allAnswerPromises.push(promise);
        });
        await Promise.all(allAnswerPromises);
        const averageByCategory = Object.entries(categoryRatings).map(([category, data]) => ({ category, average: data.count > 0 ? data.total / data.count : 0 }));
        const results = { totalResponses: responsesSnapshot.size, overallAverage: ratingCount > 0 ? totalRating / ratingCount : 0, averageByCategory, textFeedback };
        return NextResponse.json(results);
=======
        const allResponses = responsesSnapshot.docs.map(doc => ({ ...doc.data() as SurveyResponse, id: doc.id }));
        
        const availableFilters = {
            cabins: [...new Set(allResponses.map(r => r.context?.cabinName).filter(Boolean))].sort(),
            countries: [...new Set(allResponses.map(r => r.context?.country).filter(Boolean))].sort(),
            states: [...new Set(allResponses.map(r => r.context?.state).filter(Boolean))].sort(),
            cities: [...new Set(allResponses.map(r => r.context?.city).filter(Boolean))].sort(),
        };
        
        const filteredResponses = allResponses.filter(response => {
            const context = response.context;
            if (cabinName && context?.cabinName !== cabinName) return false;
            if (country && context?.country !== country) return false;
            if (state && context?.state !== state) return false;
            if (city && context?.city !== city) return false;
            return true;
        });

        const emptyResults = {
            totalResponses: 0,
            nps: { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 },
            overallAverage: 0, averageByCategory: [], textFeedback: [],
            satisfactionOverTime: [],
            insights: { weakest: null, strongest: null }
        };

        if (filteredResponses.length === 0) {
             return NextResponse.json({ results: emptyResults, filters: availableFilters });
        }
        
        const answerPromises = filteredResponses.map(response => 
            adminDb.collection('survey_responses').doc(response.id).collection('answers').get()
        );
        const allAnswerSnapshots = await Promise.all(answerPromises);
        const allAnswers = allAnswerSnapshots.flatMap((snapshot, index) => 
            snapshot.docs.map(doc => ({ ...doc.data() as Answer, responseId: filteredResponses[index].id }))
        );

        let totalRating = 0, ratingCount = 0;
        let npsResponses: number[] = [];
        const categoryRatings: { [key: string]: { total: number; count: number } } = {};
        const textFeedback: string[] = [];
        const satisfactionByDay: { [day: string]: { total: number, count: number } } = {};

        allAnswers.forEach(answer => {
            const response = filteredResponses.find(r => r.id === answer.responseId);
            if (!response) return;

            const day = formatDate(response.respondedAt.toDate(), 'yyyy-MM-dd');
            if (!satisfactionByDay[day]) satisfactionByDay[day] = { total: 0, count: 0 };
            
            if (answer.question_type_snapshot === 'RATING' && typeof answer.value === 'number') {
                totalRating += answer.value;
                ratingCount++;
                satisfactionByDay[day].total += answer.value;
                satisfactionByDay[day].count++;
                const category = answer.question_category_snapshot;
                if (!categoryRatings[category]) categoryRatings[category] = { total: 0, count: 0 };
                categoryRatings[category].total += answer.value;
                categoryRatings[category].count++;
            } else if (answer.question_type_snapshot === 'NPS' && typeof answer.value === 'number') {
                npsResponses.push(answer.value);
            } else if (answer.question_type_snapshot === 'TEXT' && answer.value) {
                textFeedback.push(String(answer.value));
            }
        });
        
        const promoters = npsResponses.filter(v => v >= 9).length;
        const passives = npsResponses.filter(v => v >= 7 && v <= 8).length;
        const detractors = npsResponses.filter(v => v <= 6).length;
        const npsScore = npsResponses.length > 0 ? Math.round(((promoters - detractors) / npsResponses.length) * 100) : 0;
        
        const averageByCategory = Object.entries(categoryRatings).map(([category, data]) => ({ category, average: data.count > 0 ? data.total / data.count : 0 }));
        
        let weakestPoint = null, strongestPoint = null;
        if(averageByCategory.length > 0) {
            const sortedCategories = [...averageByCategory].sort((a, b) => a.average - b.average);
            weakestPoint = sortedCategories[0];
            strongestPoint = sortedCategories[sortedCategories.length - 1];
        }
        
        const satisfactionOverTime = Object.entries(satisfactionByDay).map(([date, data]) => ({
            date,
            averageRating: data.count > 0 ? data.total / data.count : 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        const results = {
            totalResponses: filteredResponses.length,
            nps: { score: npsScore, promoters, passives, detractors, total: npsResponses.length },
            overallAverage: ratingCount > 0 ? totalRating / ratingCount : 0,
            averageByCategory, textFeedback, satisfactionOverTime,
            insights: { weakest: weakestPoint, strongest: strongestPoint }
        };

        return NextResponse.json({ results, filters: availableFilters });

>>>>>>> codigo-novo/main
    } catch (error: any) {
        console.error(`Erro ao agregar resultados para pesquisa ${params.surveyId}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}