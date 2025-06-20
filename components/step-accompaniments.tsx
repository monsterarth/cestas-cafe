"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, AlertTriangle } from "lucide-react"
import type { AccompanimentCategory, AccompanimentItem } from "@/types"

interface StepAccompanimentsProps {
  selectedAccompaniments: Record<string, Record<string, number>>;
  accompanimentsData: Record<string, AccompanimentCategory>;
  onUpdateAccompaniment: (categoryId: string, item: AccompanimentItem, change: number) => void;
  totalGuests: number;
  onNext: () => void;
  onBack: () => void;
}

export function StepAccompaniments({
  selectedAccompaniments,
  accompanimentsData,
  onUpdateAccompaniment,
  totalGuests,
  onNext,
  onBack,
}: StepAccompanimentsProps) {
  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6 bg-[#97A25F]">
        <h1 className="text-xl md:text-2xl font-bold">Acompanhamentos da Cesta</h1>
        <p className="text-amber-100 mt-1 text-sm md:text-base">
          Selecione os itens para o grupo e indique a quantidade de cada um.
        </p>
      </div>
      <div className="p-6 space-y-8">
        {Object.values(accompanimentsData).map((category) => {
          const categoryNameLower = category.name.toLowerCase();
          const isPaoCategory = categoryNameLower === "pães";
          const paoLimit = totalGuests * 2;
          const currentPaoCount = isPaoCategory ? 
            Object.values(selectedAccompaniments[category.id] || {}).reduce((sum, count) => sum + count, 0)
            : 0;
          const paoLimitReached = isPaoCategory && currentPaoCount >= paoLimit;

          return (
            <div key={category.id}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-xl font-bold text-[#4B4F36]">{category.name}</h3>
                {paoLimitReached && (
                  <div className="flex items-center gap-2 p-2 text-sm text-amber-800 bg-amber-100 rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Limite de {paoLimit} pães atingido.</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const currentCount = selectedAccompaniments[category.id]?.[item.id] || 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-white">
                      <div className="flex-grow">
                        <p className="font-medium text-[#4B4F36]">{item.nomeItem}</p>
                        {item.descricaoPorcao && <p className="text-stone-500 text-sm font-normal">{item.descricaoPorcao}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => onUpdateAccompaniment(category.id, item, -1)} disabled={currentCount === 0} className="h-8 w-8 p-0 rounded-full">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-lg font-semibold">{currentCount}</span>
                        <Button variant="outline" size="sm" onClick={() => onUpdateAccompaniment(category.id, item, 1)} disabled={paoLimitReached && isPaoCategory} className="h-8 w-8 p-0 rounded-full">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="flex justify-between gap-3 mt-8 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Revisar Pedido →</Button>
        </div>
      </div>
    </div>
  )
}