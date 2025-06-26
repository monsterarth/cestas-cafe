// app/api/surveys/active/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Survey } from '@/types/survey';

// GET: Retorna a pesquisa ativa com suas perguntas
export async function GET() {
    try {
        const surveysRef = adminDb.collection('surveys').where('isActive', '==', true).limit(1);
        const snapshot = await surveysRef.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Nenhuma pesquisa ativa encontrada.' }, { status: 404 });
        }
        const surveyDoc = snapshot.docs[0];
        const questionsRef = surveyDoc.ref.collection('questions').orderBy('position', 'asc');
        const questionsSnapshot = await questionsRef.get();
        const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const surveyData = { id: surveyDoc.id, ...surveyDoc.data(), questions } as Survey;
        return NextResponse.json(surveyData);
    } catch (error: any) {
        console.error("Erro ao buscar pesquisa ativa:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}