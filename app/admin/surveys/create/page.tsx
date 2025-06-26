// app/admin/surveys/create/page.tsx
import React from 'react';
import { SurveyBuilderForm } from '@/components/survey-builder-form';

export default function CreateSurveyPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Criar Nova Pesquisa</h1>
            <SurveyBuilderForm />
        </div>
    );
}