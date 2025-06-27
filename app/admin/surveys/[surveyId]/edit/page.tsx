// app/admin/surveys/[surveyId]/edit/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SurveyBuilderForm } from '@/components/survey-builder-form';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Survey } from '@/types/survey';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditSurveyPage() {
    const params = useParams();
    const surveyId = params?.surveyId as string; // USA surveyId

    // A chamada da API agora usa surveyId
    const { data: survey, isLoading, error } = useFetchData<Survey>(surveyId ? `/api/surveys/${surveyId}` : null);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-12 w-1/2 mb-6" />
                <div className="space-y-8"><div className="p-6 border rounded-lg bg-white space-y-4"><Skeleton className="h-6 w-1/4 mb-2" /><Skeleton className="h-10 w-full" /><Skeleton className="h-6 w-1/4 mb-2 mt-4" /><Skeleton className="h-20 w-full" /></div><Skeleton className="h-40 w-full" /></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-red-500 text-center">Erro ao carregar a pesquisa: {error.message}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Editar Pesquisa</h1>
            {survey ? (<SurveyBuilderForm initialData={survey} />) : (<p>Pesquisa não encontrada.</p>)}
        </div>
    );
}