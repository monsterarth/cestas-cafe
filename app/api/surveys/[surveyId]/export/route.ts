// app/api/surveys/[surveyId]/export/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Survey, Question, Answer, SurveyResponse } from '@/types/survey';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest, { params }: { params: { surveyId: string } }) {
    try {
        const { searchParams } = new URL(request.url);
        
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const cabinName = searchParams.get('cabana');
        const country = searchParams.get('pais');
        const state = searchParams.get('estado');
        const city = searchParams.get('cidade');

        if (!params.surveyId || !startDateParam || !endDateParam) {
            return NextResponse.json({ message: "Parâmetros de data são obrigatórios." }, { status: 400 });
        }

        // 1. Busca a estrutura da pesquisa (as perguntas) para usar como cabeçalho da tabela
        const surveyRef = adminDb.collection('surveys').doc(params.surveyId);
        const questionsSnap = await surveyRef.collection('questions').orderBy('position').get();
        const questions = questionsSnap.docs.map(doc => doc.data() as Question);

        // 2. Busca e filtra as respostas conforme os filtros da URL
        const startDate = startOfDay(parseISO(startDateParam));
        const endDate = endOfDay(parseISO(endDateParam));
        let responsesQuery = adminDb.collection('survey_responses')
            .where('surveyId', '==', params.surveyId)
            .where('respondedAt', '>=', Timestamp.fromDate(startDate))
            .where('respondedAt', '<=', Timestamp.fromDate(endDate));

        const responsesSnapshot = await responsesQuery.get();
        const allDocs = responsesSnapshot.docs;

        const filteredDocs = allDocs.filter(doc => {
            const context = doc.data().context;
            if (cabinName && context?.cabinName !== cabinName) return false;
            if (country && context?.country !== country) return false;
            if (state && context?.state !== state) return false;
            if (city && context?.city !== city) return false;
            return true;
        });

        // 3. Monta os dados para o CSV
        const exportDataPromises = filteredDocs.map(async (doc) => {
            const responseData = doc.data() as SurveyResponse;
            const answersSnap = await doc.ref.collection('answers').get();
            const answers = answersSnap.docs.map(answerDoc => answerDoc.data() as Answer);

            // Objeto base com dados de contexto
            const row: any = {
                'ID da Resposta': doc.id,
                'Data da Resposta': responseData.respondedAt.toDate().toLocaleString('pt-BR'),
                'Cabana': responseData.context?.cabinName || '',
                'Nº Hóspedes': responseData.context?.guestCount || '',
                'País': responseData.context?.country || '',
                'Estado': responseData.context?.state || '',
                'Cidade': responseData.context?.city || '',
                'Check-in': responseData.context?.checkInDate || '',
                'Check-out': responseData.context?.checkOutDate || '',
            };

            // Adiciona colunas dinâmicas para cada pergunta
            questions.forEach(question => {
                const answer = answers.find(a => a.question_snapshot === question.text);
                row[question.text] = Array.isArray(answer?.value) ? answer.value.join(', ') : answer?.value || '';
            });

            return row;
        });
        
        const exportData = await Promise.all(exportDataPromises);
        return NextResponse.json(exportData);

    } catch (error: any) {
        console.error(`Erro ao exportar dados para pesquisa ${params.surveyId}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}