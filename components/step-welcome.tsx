"use client"

import { Button } from "@/components/ui/button"
import type { AppConfig } from "@/types"

interface StepWelcomeProps {
  config: AppConfig
  onNext: () => void
}

export function StepWelcome({ config, onNext }: StepWelcomeProps) {
  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6" style={{ backgroundColor: config.corPrimaria }}>
        <h1 className="text-xl md:text-2xl font-bold">Bem-vindo ao nosso Café na Cesta!</h1>
      </div>
      <div className="p-6 space-y-4">
        <div className="prose prose-stone max-w-none">
          <p className="text-base leading-relaxed">{config.textoIntroducao}</p>
          <p className="font-medium text-base leading-relaxed">{config.textoAgradecimento}</p>
        </div>
        <div className="flex justify-end mt-6">
          <Button
            onClick={onNext}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.corPrimaria }}
          >
            Próximo →
          </Button>
        </div>
      </div>
    </div>
  )
}
