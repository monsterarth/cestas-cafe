// app/api/surveys/[surveyId]/results/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { Answer } from '@/types/survey';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest, { params }: { params: { surveyId: string } }) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Parâmetros de data (obrigatórios)
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        
        // ATUALIZAÇÃO: Lendo os novos parâmetros de filtro
        const cabinName = searchParams.get('cabana');
        const country = searchParams.get('pais');
        const state = searchParams.get('estado');
        const city = searchParams.get('cidade');

        if (!params.surveyId || !startDateParam || !endDateParam) {
            return NextResponse.json({ message: "Parâmetros de data são obrigatórios." }, { status: 400 });
        }

        const startDate = startOfDay(parseISO(startDateParam));
        const endDate = endOfDay(parseISO(endDateParam));

        // 1. A primeira consulta busca todos os documentos no período de tempo
        const responsesQuery = adminDb.collection('survey_responses')
            .where('surveyId', '==', params.surveyId)
            .where('respondedAt', '>=', Timestamp.fromDate(startDate))
            .where('respondedAt', '<=', Timestamp.fromDate(endDate));

        const responsesSnapshot = await responsesQuery.get();
        if (responsesSnapshot.empty) {
            return NextResponse.json({ results: { totalResponses: 0, overallAverage: 0, averageByCategory: [], textFeedback: [] }, filters: {} });
        }

        const allDocs = responsesSnapshot.docs;

        // 2. ATUALIZAÇÃO: Extrai os filtros disponíveis ANTES de filtrar os resultados
        const availableFilters = {
            cabins: [...new Set(allDocs.map(doc => doc.data().context?.cabinName).filter(Boolean))],
            countries: [...new Set(allDocs.map(doc => doc.data().context?.country).filter(Boolean))],
            states: [...new Set(allDocs.map(doc => doc.data().context?.state).filter(Boolean))],
            cities: [...new Set(allDocs.map(doc => doc.data().context?.city).filter(Boolean))],
        };
        
        // 3. ATUALIZAÇÃO: Filtra os documentos em memória com base nos parâmetros
        const filteredDocs = allDocs.filter(doc => {
            const context = doc.data().context;
            if (cabinName && context?.cabinName !== cabinName) return false;
            if (country && context?.country !== country) return false;
            if (state && context?.state !== state) return false;
            if (city && context?.city !== city) return false;
            return true;
        });

        // Se o resultado do filtro for vazio, retorna zero, mas com os filtros disponíveis
        if (filteredDocs.length === 0) {
             return NextResponse.json({ results: { totalResponses: 0, overallAverage: 0, averageByCategory: [], textFeedback: [] }, filters: availableFilters });
        }

        // 4. Agrega os dados apenas dos documentos filtrados
        let totalRating = 0, ratingCount = 0;
        const categoryRatings: { [key: string]: { total: number; count: number } } = {};
        const textFeedback: string[] = [];
        const allAnswerPromises: Promise<void>[] = [];

        filteredDocs.forEach(responseDoc => {
            const promise = responseDoc.ref.collection('answers').get().then(answersSnapshot => {
                answersSnapshot.forEach(answerDoc => {
                    const answer = answerDoc.data() as Answer;
                    if (answer.question_type_snapshot === 'RATING' && typeof answer.value === 'number') {
                        totalRating += answer.value; ratingCount++;
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
        
        const averageByCategory = Object.entries(categoryRatings).map(([category, data]) => ({ category, average: data.count > 0 ? data.total / data.count : 0, }));
        const results = { totalResponses: filteredDocs.length, overallAverage: ratingCount > 0 ? totalRating / ratingCount : 0, averageByCategory, textFeedback, };

        return NextResponse.json({ results, filters: availableFilters });

    } catch (error: any) {
        console.error(`Erro ao agregar resultados para pesquisa ${params.surveyId}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}