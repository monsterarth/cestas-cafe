// Arquivo: components/step-review.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "lucide-react"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import type { OrderState, HotDish, AccompanimentCategory, ItemPedido } from "@/types"

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
    if (!orderState.guestInfo.name.trim()) {
      setError("O nome do hóspede é obrigatório. Por favor, volte para a etapa de 'Detalhes'.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.cabin) {
      setError("A seleção da cabana é obrigatória. Por favor, volte para a etapa de 'Detalhes'.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.people || orderState.guestInfo.people === 0) {
      setError("O número de pessoas é obrigatório. Por favor, volte para a etapa de 'Detalhes'.")
      onNavigateToStep(2)
      return false
    }

    if (!orderState.guestInfo.time) {
      setError("O horário de entrega é obrigatório. Por favor, volte para a etapa de 'Detalhes'.")
      onNavigateToStep(2)
      return false
    }

    const allHotDishesSelected = orderState.persons.every(
      (p) => (p.hotDish?.typeId && p.hotDish?.flavorId) || p.hotDish?.typeId === "NONE",
    )
    if (!allHotDishesSelected) {
      setError("Todos os hóspedes devem escolher um prato quente ou selecionar a opção 'Não quero prato quente'.")
      onNavigateToStep(3)
      return false
    }

    setError(null)
    return true
  }

  const handleConfirmOrder = async () => {
    if (!validateOrder()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const itensPedido: ItemPedido[] = [] // Usando o tipo correto

      // Loop dos Pratos Quentes
      orderState.persons.forEach((person) => {
        const hotDish = person.hotDish
        if (hotDish && hotDish.typeId && hotDish.flavorId && hotDish.typeId !== "NONE") {
          const dish = hotDishes.find((d) => d.id === hotDish.typeId)
          const flavor = dish?.sabores.find((f) => f.id === hotDish.flavorId)

          if (dish && flavor) {
            itensPedido.push({
              nomeItem: dish.nomeItem,
              sabor: flavor.nomeSabor,
              quantidade: 1,
              paraPessoa: `Hóspede ${person.id}`,
              observacao: person.notes || "",
              categoria: "Pratos Quentes", // <-- INFORMAÇÃO DA CATEGORIA ADICIONADA
            })
          }
        }
      })

      // Loop dos Acompanhamentos
      Object.keys(orderState.accompaniments).forEach((catId) => {
        const category = accompaniments[catId]
        const itemsInCategory = orderState.accompaniments[catId]
        
        Object.keys(itemsInCategory).forEach((itemId) => {
          const count = itemsInCategory[itemId]
          if (count > 0) {
            const item = category?.items.find((i) => i.id === itemId)
            if (item && category) {
              itensPedido.push({
                nomeItem: item.nomeItem,
                quantidade: count,
                categoria: category.name, // <-- INFORMAÇÃO DA CATEGORIA ADICIONADA
              })
            }
          }
        })
      })

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

      if (isFirebaseAvailable()) {
        const db = await getFirebaseDb()
        if (db) {
          const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")
          await addDoc(collection(db, "pedidos"), {
            ...orderPayload,
            timestampPedido: serverTimestamp(),
          })
        }
      }

      onSuccess()
    } catch (err) {
      console.error("Erro ao processar pedido:", err)
      setError("Ocorreu um erro ao enviar seu pedido. Por favor, tente novamente em alguns instantes.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col justify-center items-center rounded-lg">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-[#4B4F36]">Enviando seu pedido...</p>
        </div>
      )}
      <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
        <div className="text-white p-4 md:p-6 bg-[#97A25F]">
          <h1 className="text-xl md:text-2xl font-bold">Revisão Final e Observações</h1>
        </div>
        <div className="p-6 space-y-4">
          <p>Por favor, confira seu pedido. Se estiver tudo certo, adicione observações e confirme.</p>

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <h4 className="font-bold text-lg mb-2">Resumo do Pedido</h4>

            <div className="mb-3 p-3 bg-white rounded-md border">
              <strong className="text-stone-700">Dados da Reserva:</strong>
              <div className="ml-4 text-sm space-y-1 mt-2">
                <p>
                  <strong>Nome:</strong> {orderState.guestInfo.name || <span className="text-red-600">Não informado</span>}
                </p>
                <p>
                  <strong>Cabana:</strong> {orderState.guestInfo.cabin || <span className="text-red-600">Não informada</span>}
                </p>
                <p>
                  <strong>Pessoas:</strong> {orderState.guestInfo.people || <span className="text-red-600">Não informado</span>}
                </p>
                <p>
                  <strong>Horário:</strong> {orderState.guestInfo.time || <span className="text-red-600">Não informado</span>}
                </p>
              </div>
            </div>

            <div className="mb-3 p-3 bg-white rounded-md border">
              <strong className="text-stone-700">Pratos Quentes:</strong>
              <div className="ml-4 space-y-2 mt-2">
                {orderState.persons.map((person) => {
                  let selectionText
                  const hotDish = person.hotDish

                  if (!hotDish) {
                    selectionText = <span className="text-red-600">Seleção pendente.</span>
                  } else if (hotDish.typeId === "NONE") {
                    selectionText = <span>Nenhum prato quente.</span>
                  } else if (hotDish.typeId && hotDish.flavorId) {
                    const dish = hotDishes.find((d) => d.id === hotDish.typeId)
                    const flavor = dish?.sabores.find((f) => f.id === hotDish.flavorId)
                    if (dish && flavor) {
                      selectionText = <span>{`${dish.nomeItem} - ${flavor.nomeSabor}`}</span>
                    } else {
                      selectionText = <span className="text-red-600">Seleção inválida.</span>
                    }
                  } else {
                    selectionText = <span className="text-red-600">Seleção pendente.</span>
                  }

                  return (
                    <div key={person.id} className="text-sm">
                      <p>
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

            <div className="mb-3 p-3 bg-white rounded-md border">
              <strong className="text-stone-700">Acompanhamentos:</strong>
              {!Object.values(orderState.accompaniments).some((category) =>
                Object.values(category).some((count) => count > 0),
              ) ? (
                <p className="ml-4 text-sm text-stone-500 mt-2">Nenhum acompanhamento selecionado.</p>
              ) : (
                Object.keys(accompaniments).map((catId) => {
                  const category = accompaniments[catId]
                  const itemsInCategory = orderState.accompaniments[catId] || {}
                  const hasItems = Object.values(itemsInCategory).some((count) => count > 0)
                  if (!hasItems) return null
                  return (
                    <div key={catId} className="mt-2">
                      <strong className="text-stone-600 text-sm">{category.name}:</strong>
                      <div className="ml-4 space-y-1 mt-1">
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
                })
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="special-requests" className="block text-sm font-medium text-[#4B4F36] mb-1">
              Observações Gerais do Pedido (opcional)
            </Label>
            <Textarea
              id="special-requests"
              value={orderState.specialRequests}
              onChange={(e) => onUpdateSpecialRequests(e.target.value)}
              placeholder="Ex: Alergias, restrições, ponto da carne, etc."
              className="border-[#ADA192] bg-[#F7FDF2] focus:border-[#97A25F]"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="border-[#ADA192] text-[#4B4F36] hover:bg-[#E9D9CD]">
              ← Voltar
            </Button>
            <Button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white min-w-[180px] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar e Enviar Pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}