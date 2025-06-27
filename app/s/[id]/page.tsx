// app/s/[id]/page.tsx
import React from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { Survey } from '@/types/survey';
import { SurveyPublicView } from '@/components/survey-public-view';

// Função para buscar os dados da pesquisa no servidor
async function getSurveyData(id: string): Promise<Survey | null> {
    try {
        const surveyRef = adminDb.collection('surveys').doc(id);
        const surveyDoc = await surveyRef.get();

        if (!surveyDoc.exists) {
            return null;
        }

        const questionsRef = surveyRef.collection('questions').orderBy('position', 'asc');
        const questionsSnapshot = await questionsRef.get();
        
        const questions = questionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Survey['questions'];

        const surveyData = {
            id: surveyDoc.id,
            ...surveyDoc.data(),
            questions,
        } as Survey;
        
        return surveyData;

    } catch (error) {
        console.error("Erro ao buscar dados da pesquisa:", error);
        return null;
    }
}

// O componente da página
export default async function PublicSurveyPage({ params }: { params: { id: string } }) {
    const surveyData = await getSurveyData(params.id);

    if (!surveyData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Pesquisa não encontrada</h1>
                    <p className="text-muted-foreground">O link que você acessou pode estar incorreto ou a pesquisa não está mais disponível.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-slate-50 min-h-screen">
            <SurveyPublicView survey={surveyData} />
        </main>
    );
}