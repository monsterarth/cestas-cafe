// app/s/[surveyId]/page.tsx
import React from 'react';
import { adminDb } from '@/lib/firebase-admin';
// CORREÇÃO: Separando as importações. AppConfig vem de types/index, o resto de types/survey.
import { AppConfig } from '@/types'; 
import { Survey, Question } from '@/types/survey';
import { SurveyPublicView } from '@/components/survey-public-view';
import { Timestamp } from 'firebase-admin/firestore';

async function getSurveyData(id: string): Promise<Survey | null> {
    try {
        const surveyRef = adminDb.collection('surveys').doc(id);
        const surveyDoc = await surveyRef.get();
        if (!surveyDoc.exists) return null;
        const rawData = surveyDoc.data();
        if (!rawData) return null;
        const questionsRef = surveyRef.collection('questions').orderBy('position', 'asc');
        const questionsSnapshot = await questionsRef.get();
        const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
        return {
            id: surveyDoc.id,
            title: rawData.title,
            description: rawData.description,
            isActive: rawData.isActive,
            createdAt: (rawData.createdAt as Timestamp).toDate().toISOString(),
            questions,
        };
    } catch (error) {
        console.error("Erro ao buscar dados da pesquisa:", error);
        return null;
    }
}

async function getAppConfig(): Promise<AppConfig | null> {
    try {
        const configRef = adminDb.collection('configuracoes').doc('app');
        const configDoc = await configRef.get();
        return configDoc.exists ? configDoc.data() as AppConfig : null;
    } catch (error) {
        console.error("Erro ao buscar configurações do app:", error);
        return null;
    }
}

export default async function PublicSurveyPage({ params }: { params: { surveyId: string } }) {
    const [surveyData, appConfig] = await Promise.all([
        getSurveyData(params.surveyId),
        getAppConfig()
    ]);

    if (!surveyData || !surveyData.isActive) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center p-4">
                    <h1 className="text-2xl font-bold">Pesquisa não disponível</h1>
                    <p className="text-muted-foreground">O link que você acessou pode estar incorreto ou a pesquisa foi desativada.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
            <SurveyPublicView survey={surveyData} config={appConfig} />
        </main>
    );
}