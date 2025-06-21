// Arquivo: components/step-welcome-message.tsx
'use client';

import { useOrder } from "@/hooks/use-order";
import { AppConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";

interface StepWelcomeMessageProps {
    config: AppConfig;
}

export function StepWelcomeMessage({ config }: StepWelcomeMessageProps) {
    const { setStep } = useOrder();

    return (
        <Card className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
            <div className="text-white p-4 md:p-6 bg-[#97A25F] flex items-center gap-4">
                <PartyPopper className="w-8 h-8 text-amber-300" />
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Seja Bem-Vindo(a)!</h1>
                    <p className="text-amber-100 mt-1 text-sm md:text-base">
                        Preparamos tudo com muito carinho para você.
                    </p>
                </div>
            </div>
            <CardContent className="p-6 text-center space-y-6">
                <p className="text-lg text-stone-700 whitespace-pre-line">
                    {config.textoBoasVindas || "Sua experiência gastronômica na Fazenda do Rosa começa agora. Siga as etapas para montar seu café da manhã perfeito!"}
                </p>
                <Button 
                    onClick={() => setStep(3)} // Pula para a etapa 3 (Pratos Quentes)
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                >
                    Começar a Montar a Cesta
                </Button>
            </CardContent>
        </Card>
    );
}