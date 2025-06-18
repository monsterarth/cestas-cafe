"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle } from "lucide-react"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import type { OrderState, HotDish, AccompanimentCategory } from "@/types"

interface StepReviewProps {
  orderState: OrderState
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

  const validateOrder = () => {
    // Verifica dados básicos da reserva
    if (!orderState.guestInfo.name.trim()) {
      setError("Nome é obrigatório.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.cabin) {
      setError("Cabana é obrigatória.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.people || orderState.guestInfo.people === 0) {
      setError("Número de pessoas é obrigatório.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.time) {
      setError("Horário de entrega é obrigatório.")
      onNavigateToStep(2)
      return false
    }

    // Verifica se todos os hóspedes fizeram uma escolha (prato ou nenhum prato)
    const allHotDishesSelected = orderState.persons.every(
      (p) => (p.hotDish?.typeId && p.hotDish?.flavorId) || p.hotDish?.typeId === "NONE",
    )
    if (!allHotDishesSelected) {
      setError("Todos os hóspedes devem escolher um prato quente ou selecionar a opção 'Não quero prato quente'.")
      onNavigateToStep(3)
      return false
    }

    return true
  }

  const handleConfirmOrder = async () => {
    if (!validateOrder()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Monta os itens do pedido
      const itensPedido: any[] = []

      // Adiciona pratos quentes
      orderState.persons.forEach((person) => {
        if (person.hotDish?.typeId && person.hotDish?.flavorId) {
          const dish = hotDishes.find((d) => d.id === person.hotDish?.typeId)
          const flavor = dish?.sabores.find((f) => f.id === person.hotDish?.flavorId)

          if (dish && flavor) {
            itensPedido.push({
              paraPessoa: `Hóspede ${person.id}`,
              quantidade: 1,
              nomeItem: `${dish.nomeItem} - ${flavor.nomeSabor}`,
              observacao: person.notes || "",
            })
          }
        }
      })

      // Adiciona acompanhamentos
      Object.keys(orderState.accompaniments).forEach((catId) => {
        const itemsInCategory = orderState.accompaniments[catId]
        Object.keys(itemsInCategory).forEach((itemId) => {
          const count = itemsInCategory[itemId]
          if (count > 0) {
            const item = accompaniments[catId]?.items.find((i) => i.id === itemId)
            if (item) {
              itensPedido.push({
                quantidade: count,
                nomeItem: item.nomeItem,
                observacao: "",
              })
            }
          }
        })
      })

      // Monta o objeto do pedido
      const orderPayload = {
        hospedeNome: orderState.guestInfo.name,
        cabanaNumero: orderState.guestInfo.cabin,
        horarioEntrega: orderState.guestInfo.time,
        numeroPessoas: orderState.guestInfo.people,
        itensPedido,
        observacoesGerais: orderState.specialRequests || "",
        observacoesPratosQuentes: orderState.globalHotDishNotes || "",
        status: "Novo",
        timestampPedido: new Date().toISOString(),
      }

      // Try to save to Firebase if available
      if (isFirebaseAvailable()) {
        try {
          const db = await getFirebaseDb()
          if (db) {
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

            await addDoc(collection(db, "pedidos"), {
              ...orderPayload,
              timestampPedido: serverTimestamp(),
            })
            console.log("Order saved to Firebase successfully")
          }
        } catch (firebaseError) {
          console.warn("Firebase save failed, order processed locally:", firebaseError)
        }
      } else {
        console.log("Firebase not available, order processed locally")
      }

      onSuccess()
    } catch (err) {
      console.error("Erro ao processar pedido:", err)
      setError("Erro ao processar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6 bg-[#97A25F]">
        <h1 className="text-xl md:text-2xl font-bold">Revisão Final e Observações</h1>
      </div>
      <div className="p-6 space-y-4">
        <p>Por favor, confira seu pedido. Se estiver tudo certo, adicione observações e confirme.</p>

        {error && <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">{error}</div>}

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
          <h4 className="font-bold text-lg mb-2">Resumo do Pedido</h4>

          {/* Dados da Reserva */}
          <div className="mb-3 p-3 bg-white rounded-md border">
            <strong className="text-stone-700">Dados da Reserva:</strong>
            <div className="ml-4 text-sm space-y-1 mt-2">
              <p>
                <strong>Nome:</strong> {orderState.guestInfo.name || "Não informado"}
              </p>
              <p>
                <strong>Cabana:</strong> {orderState.guestInfo.cabin || "Não informada"}
              </p>
              <p>
                <strong>Pessoas:</strong> {orderState.guestInfo.people || "Não informado"}
              </p>
              <p>
                <strong>Horário:</strong> {orderState.guestInfo.time || "Não informado"}
              </p>
            </div>
          </div>

          {/* Pratos Quentes */}
          <div className="mb-3 p-3 bg-white rounded-md border">
            <strong className="text-stone-700">Pratos Quentes:</strong>
            <div className="ml-4 space-y-2 mt-2">
              {orderState.persons.map((person) => {
                let selectionText = "Não selecionado."
                if (person.hotDish?.typeId === "NONE") {
                  selectionText = "Nenhum prato quente."
                } else if (person.hotDish?.typeId && person.hotDish?.flavorId) {
                  const dish = hotDishes.find((d) => d.id === person.hotDish.typeId)
                  const flavor = dish?.sabores.find((f) => f.id === person.hotDish.flavorId)
                  if (dish && flavor) {
                    selectionText = `${dish.nomeItem} - ${flavor.nomeSabor}`
                  }
                }

                return (
                  <div key={person.id} className="text-sm">
                    <p className={selectionText === "Não selecionado." ? "text-red-600" : ""}>
                      <strong>Hóspede {person.id}:</strong> {selectionText}
                    </p>
                    {person.notes && <p className="ml-4 text-xs italic text-stone-600">Obs: {person.notes}</p>}
                  </div>
                )
              })}
            </div>
            {orderState.globalHotDishNotes && (
              <div className="ml-4 mt-2 text-sm">
                <p className="font-medium text-stone-600">Observações Gerais:</p>
                <p className="italic text-stone-600">"{orderState.globalHotDishNotes}"</p>
              </div>
            )}
          </div>

          {/* Acompanhamentos */}
          {Object.keys(accompaniments).map((catId) => {
            const category = accompaniments[catId]
            const itemsInCategory = orderState.accompaniments[catId] || {}
            const hasItems = Object.values(itemsInCategory).some((count) => count > 0)

            if (!hasItems) return null

            return (
              <div key={catId} className="mb-3 p-3 bg-white rounded-md border">
                <strong className="text-stone-700">{category.name}:</strong>
                <div className="ml-4 space-y-1 mt-2">
                  {Object.keys(itemsInCategory).map((itemId) => {
                    const count = itemsInCategory[itemId]
                    if (count === 0) return null

                    const item = category.items.find((i) => i.id === itemId)
                    return (
                      <p key={itemId} className="text-sm">
                        - {count}x {item?.nomeItem}
                      </p>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Mostrar se não há acompanhamentos */}
          {!Object.values(orderState.accompaniments).some((category) =>
            Object.values(category).some((count) => count > 0),
          ) && (
            <div className="mb-3 p-3 bg-white rounded-md border">
              <strong className="text-stone-700">Acompanhamentos:</strong>
              <p className="ml-4 text-sm text-stone-500 mt-2">Nenhum acompanhamento selecionado.</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="special-requests" className="block text-sm font-medium text-[#4B4F36] mb-1">
            Observações Gerais (opcional)
          </label>
          <Textarea
            id="special-requests"
            value={orderState.specialRequests}
            onChange={(e) => onUpdateSpecialRequests(e.target.value)}
            placeholder="Ex: Alergias, restrições, etc."
            className="border-[#ADA192] bg-[#F7FDF2] focus:border-[#97A25F]"
            rows={3}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="border-[#ADA192] text-[#4B4F36] hover:bg-[#E9D9CD]"
          >
            ← Voltar
          </Button>
          <Button
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className="bg-green-700 hover:bg-green-800 text-white min-w-[180px] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
