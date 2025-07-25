// components/step-welcome.tsx
'use client';

import { AppConfig } from "@/types";
import { Button } from "./ui/button";

interface StepWelcomeProps {
    config: AppConfig | null;
    onNextStep: () => void;
}

export const StepWelcome = ({ config, onNextStep }: StepWelcomeProps) => {
    if (!config) return null;

    return (
        <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
          {/* CORREÇÃO: Usando 'corDestaque' */}
          <div className="text-white p-4 md:p-6" style={{ backgroundColor: config.corDestaque }}>
            <h1 className="text-xl md:text-2xl font-bold">Bem-vindo ao nosso Café na Cesta!</h1>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-600">
                {/* CORREÇÃO: Usando 'textoBoasVindas' */}
                {config.textoBoasVindas || "Prepare-se para uma experiência deliciosa! Siga os passos para montar sua cesta de café da manhã perfeita."}
            </p>
            <div className="text-right">
                {/* CORREÇÃO: Usando 'corDestaque' e 'corDestaqueTexto' */}
                <Button onClick={onNextStep} style={{ backgroundColor: config.corDestaque, color: config.corDestaqueTexto }}>
                    Começar
                </Button>
            </div>
          </div>
        </div>
    );
}