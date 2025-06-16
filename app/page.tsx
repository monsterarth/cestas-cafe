// app/page.tsx

"use client"

import type React from "react"
import { useReducer, useState } from "react" // Alterado de useState para useReducer
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

// --- LÓGICA DO REDUCER ---

// 1. Definimos o estado inicial do pedido
const initialOrderState: OrderState = {
  guestInfo: { name: "", cabin: "", people: 0, time: "" },
  persons: [],
  accompaniments: {},
  globalHotDishNotes: "",
  specialRequests: "",
}

// 2. Definimos todas as possíveis ações que podem alterar o estado
type OrderAction =
  | { type: "UPDATE_GUEST_INFO"; payload: Partial<OrderState["guestInfo"]> }
  | { type: "SET_PEOPLE"; payload: number }
  | { type: "SELECT_DISH"; payload: { personIndex: number; dishId: string } }
  | { type: "SELECT_FLAVOR"; payload: { personIndex: number; flavorId: string } }
  | { type: "TOGGLE_NO_DISH"; payload: { personIndex: number } }
  | { type: "UPDATE_GLOBAL_NOTES"; payload: string }
  | { type: "UPDATE_ACCOMPANIMENT"; payload: { categoryId: string; itemId: string; change: number } }
  | { type: "UPDATE_SPECIAL_REQUESTS"; payload: string }

// 3. Criamos a função reducer que centraliza toda a lógica de atualização
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "UPDATE_GUEST_INFO":
      return { ...state, guestInfo: { ...state.guestInfo, ...action.payload } }

    case "SET_PEOPLE":
      const people = action.payload
      const persons = Array.from({ length: people }, (_, i) => ({
        id: i + 1,
        hotDish: null,
        notes: "",
      }))
      return { ...state, guestInfo: { ...state.guestInfo, people }, persons }

    case "SELECT_DISH":
      return {
        ...state,
        persons: state.persons.map((person, index) =>
          index === action.payload.personIndex
            ? { ...person, hotDish: { typeId: action.payload.dishId, flavorId: "" } }
            : person,
        ),
      }

    case "SELECT_FLAVOR":
      return {
        ...state,
        persons: state.persons.map((person, index) =>
          index === action.payload.personIndex && person.hotDish
            ? { ...person, hotDish: { ...person.hotDish, flavorId: action.payload.flavorId } }
            : person,
        ),
      }

    case "TOGGLE_NO_DISH": {
      const { personIndex } = action.payload
      const personToUpdate = state.persons[personIndex]
      const newHotDishState =
        personToUpdate?.hotDish?.typeId === "NONE" ? null : { typeId: "NONE", flavorId: "NONE" }
      return {
        ...state,
        persons: state.persons.map((person, index) =>
          index === personIndex ? { ...person, hotDish: newHotDishState } : person,
        ),
      }
    }

    case "UPDATE_GLOBAL_NOTES":
      return { ...state, globalHotDishNotes: action.payload }

    case "UPDATE_ACCOMPANIMENT": {
      const { categoryId, itemId, change } = action.payload
      const newAccompaniments = JSON.parse(JSON.stringify(state.accompaniments)) // Deep copy
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
      return { ...state, accompaniments: newAccompaniments }
    }

    case "UPDATE_SPECIAL_REQUESTS":
      return { ...state, specialRequests: action.payload }

    default:
      return state
  }
}

export default function Home() {
  const { hotDishes, cabins, deliveryTimes, accompaniments, appConfig, loading, error, refetch } = useFirebaseData()

  const [currentStep, setCurrentStep] = useState(1)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  // 4. Substituímos o useState pelo useReducer
  const [orderState, dispatch] = useReducer(orderReducer, initialOrderState)

  // 5. As funções "handle" agora apenas "despacham" (dispatch) ações para o reducer
  const handleUpdateGuestInfo = (updates: Partial<OrderState["guestInfo"]>) => {
    dispatch({ type: "UPDATE_GUEST_INFO", payload: updates })
  }
  
  const handleSetPeople = (people: number) => {
    dispatch({ type: "SET_PEOPLE", payload: people });
  };
  
  // Note que a função `onUpdateOrderState` em StepDetails foi separada em duas para maior clareza.
  const updateOrderStateForDetails = (updates: Partial<OrderState>) => {
    if(updates.guestInfo && updates.guestInfo.name !== undefined) {
      handleUpdateGuestInfo({ name: updates.guestInfo.name });
    }
     if(updates.guestInfo && updates.guestInfo.cabin !== undefined) {
      handleUpdateGuestInfo({ cabin: updates.guestInfo.cabin });
      // Resetar pessoas ao trocar de cabana, como antes.
      handleSetPeople(0);
    }
     if(updates.guestInfo && updates.guestInfo.time !== undefined) {
      handleUpdateGuestInfo({ time: updates.guestInfo.time });
    }
    if (updates.guestInfo && updates.guestInfo.people !== undefined) {
       handleSetPeople(updates.guestInfo.people);
    }
  }


  const handleSelectDish = (personIndex: number, dishId: string) => {
    dispatch({ type: "SELECT_DISH", payload: { personIndex, dishId } })
  }

  const handleSelectFlavor = (personIndex: number, flavorId: string) => {
    dispatch({ type: "SELECT_FLAVOR", payload: { personIndex, flavorId } })
  }

  const handleUpdateNotes = (personIndex: number, notes: string) => {
    // Esta função não foi implementada no reducer, pois não era usada. Mantendo assim por enquanto.
    // Se precisar dela, podemos adicionar a ação 'UPDATE_PERSON_NOTES'.
  }

  const handleNotesChange = (notes: string) => {
    dispatch({ type: "UPDATE_GLOBAL_NOTES", payload: notes })
  }

  const handleUpdateAccompaniment = (categoryId: string, itemId: string, change: number) => {
    dispatch({ type: "UPDATE_ACCOMPANIMENT", payload: { categoryId, itemId, change } })
  }

  const handleSpecialRequestsChange = (requests: string) => {
    dispatch({ type: "UPDATE_SPECIAL_REQUESTS", payload: requests })
  }

  const handleSelectNoHotDish = (personIndex: number) => {
    dispatch({ type: "TOGGLE_NO_DISH", payload: { personIndex } })
  }

  // --- Renderização ---

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center z-50 bg-[#F7FDF2]">
        <p className="text-red-600 p-4 text-center">{error}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

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
                onUpdateOrderState={updateOrderStateForDetails}
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