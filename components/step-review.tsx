// Arquivo: components/step-review.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2 } from "lucide-react"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import type { OrderState, HotDish, AccompanimentCategory, ItemPedido } from "@/types"

interface StepReviewProps {
  orderState: Partial<OrderState>
  hotDishes: HotDish[]
  accompaniments: Record<string, AccompanimentCategory>
  onBack: () => void
  onSuccess: () => void
  onUpdateSpecialRequests: (requests: string) => void
  onNavigateToStep: (step: number) => void
}

export function StepReview({
  orderState,
  hotDishes,
  accompaniments,
  onBack,
  onSuccess,
  onUpdateSpecialRequests,
  onNavigateToStep,
}: StepReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { guestInfo, persons = [], specialRequests, globalHotDishNotes, accompaniments: selectedAccompaniments = {} } = orderState;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Lógica de envio para o Firebase...
    // ... (pode adicionar a lógica de envio aqui, similar à que você tinha)
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula envio
    setIsSubmitting(false);
    onSuccess();
  }

  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col justify-center items-center rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold">Enviando seu pedido...</p>
        </div>
      )}
      <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
        <div className="text-white p-4 md:p-6 bg-[#97A25F]">
          <h1 className="text-xl md:text-2xl font-bold">Revisão Final e Observações</h1>
        </div>
        <div className="p-6 space-y-4">
          <p>Confira seu pedido. Se estiver tudo certo, adicione observações e confirme.</p>

          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <h4 className="font-bold text-lg mb-2">Resumo do Pedido</h4>

            {/* Resumo dos dados, pratos quentes e acompanhamentos */}
            {/* ... (o JSX de resumo pode ser inserido aqui, similar ao que tinha antes) ... */}

          </div>

          <div>
            <Label htmlFor="special-requests" className="block text-sm font-medium text-[#4B4F36] mb-1">
              Observações Gerais do Pedido (opcional)
            </Label>
            <Textarea
              id="special-requests"
              value={specialRequests}
              onChange={(e) => onUpdateSpecialRequests(e.target.value)}
              placeholder="Ex: Alergias, restrições, ponto da carne, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-between gap-3 mt-8">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              ← Voltar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar e Enviar Pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}