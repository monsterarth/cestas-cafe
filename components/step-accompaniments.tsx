"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, AlertTriangle } from "lucide-react"
import type { AccompanimentCategory, OrderState } from "@/types"

interface StepAccompanimentsProps {
  orderState: OrderState
  accompaniments: Record<string, AccompanimentCategory>
  onUpdateAccompaniment: (categoryId: string, itemId: string, change: number, accompaniments: any) => void
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
          const maxGuests = orderState.guestInfo.people || 1
          const categoryNameLower = category.name.toLowerCase()
          const isPaoCategory = categoryNameLower === "pães"
          const isBoloCategory = categoryNameLower === "bolos"
          const isLimitedByCategory = isPaoCategory || isBoloCategory

          const limit = isPaoCategory ? maxGuests * 2 : maxGuests
          const limitMessage = `Limite de ${limit} ${
            isPaoCategory ? "pães" : "bolo(s)"
          } para ${maxGuests} pessoa(s).`

          const totalInCategory = isLimitedByCategory
            ? category.items.reduce((total, currentItem) => {
                return total + (orderState.accompaniments[category.id]?.[currentItem.id] || 0)
              }, 0)
            : 0

          const isLimitReached = isLimitedByCategory && totalInCategory >= limit

          return (
            <div key={category.id}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-xl font-bold text-[#4B4F36]">{category.name}</h3>
                {isLimitReached && (
                  <div className="flex items-center gap-2 p-2 text-sm text-amber-800 bg-amber-100 border border-amber-200 rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{limitMessage}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const currentCount = orderState.accompaniments[category.id]?.[item.id] || 0

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
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateAccompaniment(category.id, item.id, -1, accompaniments)}
                          disabled={currentCount === 0}
                          className="h-8 w-8 p-0 rounded-full border-[#ADA192] hover:bg-[#E9D9CD]"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-lg font-semibold text-[#4B4F36]">{currentCount}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateAccompaniment(category.id, item.id, 1, accompaniments)}
                          disabled={isLimitReached}
                          className="h-8 w-8 p-0 rounded-full border-[#ADA192] hover:bg-[#E9D9CD] disabled:opacity-50 disabled:cursor-not-allowed"
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