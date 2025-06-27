// components/survey-success-card.tsx
'use client';

import { AppConfig } from "@/types";
import { CheckCircle } from "lucide-react";

interface SurveySuccessCardProps {
    config: AppConfig | null;
}

export function SurveySuccessCard({ config }: SurveySuccessCardProps) {
    return (
        <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2] text-center w-full max-w-2xl mx-auto">
            <div className="p-8 space-y-6">
                <div className="flex justify-center">
                    <CheckCircle className="w-20 h-20 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-700">
                    {config?.surveySuccessTitle || 'Obrigado por responder!'}
                </h2>
                <div className="space-y-4">
                    <p className="text-[#4B4F36] text-lg">
                        {config?.surveySuccessSubtitle || 'Sua opinião é muito importante para nós e nos ajuda a melhorar sua experiência.'}
                    </p>
                </div>
                <div className="pt-4 border-t border-stone-200">
                    <p className="text-sm text-stone-600">
                        {config?.surveySuccessFooter || 'Equipe Fazenda do Rosa'}
                    </p>
                </div>
            </div>
        </div>
    );
}