// app/page.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { useFirebaseData } from "@/hooks/use-firebase-data"
import { LoadingScreen } from "@/components/loading-screen"
import { StepNavigation } from "@/components/step-navigation"
import { GuestAccordion } from "@/components/guest-accordion"
import { OrderSidebar } from "@/components/order-sidebar"
import { StepDetails } from "@/components/step-details"
import { StepAccompaniments } from "@/components/step-accompaniments"
import { StepWelcome } from "@/components/step-welcome"
import { AppHeader } from "@/components/app-header"
import type { OrderState } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle } from "lucide-react"
import { StepReview } from "@/components/step-review"
import { StepSuccess } from "@/components/step-success"

export default function Home() {
  // A linha abaixo é crucial. Garante que `appConfig` seja criado corretamente.
  const { hotDishes, cabins, deliveryTimes, accompaniments, appConfig, loading, error } = useFirebaseData()

  const [currentStep, setCurrentStep] = useState(1)
  const [orderState, setOrderState] = useState<OrderState>({
    guestInfo: {
      name: "",
      cabin: "",
      people: 0,
      time: "",
    },
    persons: [],
    accompaniments: {},
    globalHotDishNotes: "",
    specialRequests: "",
  })
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const updateOrderState = (updates: Partial<OrderState>) => {
    setOrderState((prev) => ({ ...prev, ...updates }))
  }

  const handleSelectDish = (personIndex: number, dishId: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) =>
        index === personIndex ? { ...person, hotDish: { typeId: dishId, flavorId: "" } } : person,
      ),
    }))
  }

  const handleSelectFlavor = (personIndex: number, flavorId: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) =>
        index === personIndex && person.hotDish ? { ...person, hotDish: { ...person.hotDish, flavorId } } : person,
      ),
    }))
  }

  const handleUpdateNotes = (personIndex: number, notes: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) => (index === personIndex ? { ...person, notes } : person)),
    }))
  }

  const handleNotesChange = (notes: string) => {
    setOrderState((prev) => ({ ...prev, globalHotDishNotes: notes }))
  }
      setOrderState((prev) => {
      const newAccompaniments = { ...prev.accompaniments }
      if (!newAccompaniments[categoryId]) {
        newAccompaniments[categoryId] = {}
      }
      const currentCount = newAccompaniments[categoryId][itemId] || 0
      let newCount = currentCount + change
      if (newCount < 0) newCount = 0
      if (newCount === 0) {
        delete newAccompaniments[categoryId][itemId]
      } else {
        newAccompaniments[categoryId][itemId] = newCount
      }
      return { ...prev, accompaniments: newAccompaniments }
    })
  }

  const handleSpecialRequestsChange = (requests: string) => {
    setOrderState((prev) => ({ ...prev, specialRequests: requests }))
  }

  const handleSelectNoHotDish = (personIndex: number) => {
    setOrderState((prev) => {
      const personToUpdate = prev.persons[personIndex]
      // Se o usuário já tinha optado por "não quero", a seleção é resetada (volta para null).
      // Caso contrário, a seleção é marcada como "NONE".
      const newHotDishState =
        personToUpdate?.hotDish?.typeId === "NONE" ? null : { typeId: "NONE", flavorId: "NONE" }

      return {
        ...prev,
        persons: prev.persons.map((person, index) =>
          index === personIndex ? { ...person, hotDish: newHotDishState } : person,
        ),
      }
    })
  }

  // Verificações de segurança
  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center z-50 bg-[#F7FDF2]">
        <p className="text-red-600 p-4 text-center">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  // Guarda de segurança que adicionamos no passo anterior
  if (!appConfig) {
    return <LoadingScreen message="Aguardando configurações..." />
  }

  return (
    <div className="min-h-screen bg-[#E9D9CD] text-[#4B4F36]">
      <AppHeader config={appConfig} />

      {!orderSubmitted && <StepNavigation currentStep={currentStep} onStepClick={setCurrentStep} />}

      <main className="container mx-auto p-2 md:p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && !orderSubmitted && <StepWelcome config={appConfig} onNext={() => setCurrentStep(2)} />}

            {currentStep === 2 && !orderSubmitted && (
              <StepDetails
                orderState={orderState}
                cabins={cabins}
                deliveryTimes={deliveryTimes}
                onUpdateOrderState={updateOrderState}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && !orderSubmitted && (
              <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
                <div className="text-white p-4 md:p-6" style={{ backgroundColor: appConfig.corPrimaria }}>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold">Escolha dos Pratos Quentes</h1>
                      <p className="text-amber-100 mt-1 text-sm md:text-base">
                        Cada hóspede deve escolher <strong>1 prato quente</strong>. Toque no nome para ver as opções.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <GuestAccordion
                    persons={orderState.persons}
                    hotDishes={hotDishes}
                    onSelectDish={handleSelectDish}
                    onSelectFlavor={handleSelectFlavor}
                    onUpdateNotes={handleUpdateNotes}
                    onSelectNoHotDish={handleSelectNoHotDish}
                  />

                  <div className="pt-6 md:pt-8 border-t border-[#ADA192]">
                    <div className="space-y-3 mb-6">
                      <label className="text-base md:text-lg font-bold flex items-center gap-2 text-[#4B4F36]">
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" style={{ color: appConfig.corPrimaria }} />
                        Observações Gerais para Pratos Quentes
                      </label>
                      <Textarea
                        placeholder="Observações que se aplicam a todos os pratos quentes (ex: sem cebola, alergias, preferências...)"
                        value={orderState.globalHotDishNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        className="resize-none border-[#ADA192] bg-[#F7FDF2] focus:border-[#97A25F]"
                        style={
                          {
                            "--tw-ring-color": appConfig.corPrimaria,
                            borderColor: orderState.globalHotDishNotes ? appConfig.corPrimaria : undefined,
                          } as React.CSSProperties
                        }
                        rows={4}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="border-[#ADA192] text-[#4B4F36] hover:bg-[#E9D9CD]"
                      >
                        ← Voltar
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(4)}
                        className="text-white hover:opacity-90"
                        style={{ backgroundColor: appConfig.corPrimaria }}
                      >
                        Próximo →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && !orderSubmitted && (
              <StepAccompaniments
                orderState={orderState}
                accompaniments={accompaniments}
                onUpdateAccompaniment={handleUpdateAccompaniment}
                onNext={() => setCurrentStep(5)}
                onBack={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 5 && !orderSubmitted && (
              <StepReview
                orderState={orderState}
                hotDishes={hotDishes}
                accompaniments={accompaniments}
                onBack={() => setCurrentStep(4)}
                onSuccess={() => setOrderSubmitted(true)}
                onUpdateSpecialRequests={handleSpecialRequestsChange}
                onNavigateToStep={setCurrentStep}
              />
            )}

            {orderSubmitted && <StepSuccess />}
          </div>

          {!orderSubmitted && (
            <div className="hidden lg:block lg:col-span-1">
              <OrderSidebar
                orderState={orderState}
                hotDishes={hotDishes}
                accompaniments={accompaniments}
                appConfig={appConfig}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}