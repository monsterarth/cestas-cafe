"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import type { AccompanimentCategory, OrderState } from "@/types"

interface StepAccompanimentsProps {
  orderState: OrderState
  accompaniments: Record<string, AccompanimentCategory>
  onUpdateAccompaniment: (categoryId: string, itemId: string, change: number) => void
  onNext: () => void
  onBack: () => void
}

export function StepAccompaniments({
  orderState,
  accompaniments,
  onUpdateAccompaniment,
  onNext,
  onBack,
}: StepAccompanimentsProps) {
  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6 bg-[#97A25F]">
        <h1 className="text-xl md:text-2xl font-bold">Acompanhamentos para a Cesta</h1>
        <p className="text-amber-100 mt-1 text-sm md:text-base">
          Selecione os itens que o grupo deseja e indique a quantidade para cada um.
        </p>
      </div>
      <div className="p-6 space-y-8">
        {Object.values(accompaniments).map((category) => {
          const maxGuests = orderState.guestInfo.people || 1;
          const categoryNameLower = category.name.toLowerCase();
          const isLimitedByCategory = categoryNameLower === 'pães' || categoryNameLower === 'bolos';
          
          let totalInCategory = 0;
          if (isLimitedByCategory) {
            totalInCategory = category.items.reduce((total, currentItem) => {
              return total + (orderState.accompaniments[category.id]?.[currentItem.id] || 0);
            }, 0);
          }

          return (
            <div key={category.id}>
              <h3 className="text-xl font-bold text-[#4B4F36] mb-4">{category.name}</h3>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const currentCount = orderState.accompaniments[category.id]?.[item.id] || 0;
                  const isAddButtonDisabled = isLimitedByCategory
                    ? totalInCategory >= maxGuests
                    : currentCount >= maxGuests;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between flex-wrap gap-4 p-3 border border-[#ADA192] rounded-lg bg-[#F7FDF2]"
                    >
                      <div className="flex-grow min-w-[200px]">
                        <p className="font-medium text-[#4B4F36]">
                          {item.emoji || "🥖"} {item.nomeItem}
                        </p>
                        {item.descricaoPorcao && (
                          <p className="text-stone-500 text-sm font-normal">{item.descricaoPorcao}</p>
                        )}
                        <p className="text-xs text-stone-500">{item.calorias} kcal</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateAccompaniment(category.id, item.id, -1)}
                          disabled={currentCount === 0}
                          className="h-8 w-8 p-0 rounded-full border-[#ADA192] hover:bg-[#E9D9CD]"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-lg font-semibold text-[#4B4F36]">{currentCount}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateAccompaniment(category.id, item.id, 1)}
                          disabled={isAddButtonDisabled}
                          className="h-8 w-8 p-0 rounded-full border-[#ADA192] hover:bg-[#E9D9CD]"
                        >
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

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
          <Button variant="outline" onClick={onBack} className="border-[#ADA192] text-[#4B4F36] hover:bg-[#E9D9CD]">
            ← Voltar
          </Button>
          <Button onClick={onNext} className="bg-[#97A25F] hover:bg-[#97A25F]/90 text-white">
            Revisar Pedido →
          </Button>
        </div>
      </div>
    </div>
  )
}
