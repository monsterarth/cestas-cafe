// Arquivo: app/page.tsx
"use client"

import React from "react";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { useOrder, deactivateComanda } from "@/hooks/use-order";
import { LoadingScreen } from "@/components/loading-screen";
import { StepNavigation } from "@/components/step-navigation";
import { GuestAccordion } from "@/components/guest-accordion";
import { OrderSidebar } from "@/components/order-sidebar";
import { StepDetails } from "@/components/step-details";
import { StepAccompaniments } from "@/components/step-accompaniments";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { StepReview } from "@/components/step-review";
import { StepSuccess } from "@/components/step-success";
import { Toaster } from "sonner";
import { StepAuthAndConfirm } from "@/components/step-auth-and-confirm";
import { StepConfirm } from "@/components/step-confirm";
import { StepWelcomeMessage } from "@/components/step-welcome-message";

export default function Home() {
  const { hotDishes, cabins, deliveryTimes, accompaniments, appConfig, loading, error } = useFirebaseData();
  
  const {
    isAuthenticated,
    comanda,
    currentStep,
    completedSteps,
    guestInfo,
    persons,
    accompaniments: orderAccompaniments,
    globalHotDishNotes,
    specialRequests,
    setStep,
    updateGuestInfo,
    handleSelectDish,
    handleSelectFlavor,
    handleSelectNoHotDish,
    handleNotesChange,
    handleUpdateAccompaniment,
    handleSpecialRequestsChange,
  } = useOrder();
  
  const [orderSubmitted, setOrderSubmitted] = React.useState(false);

  const handleOrderSuccess = () => {
    if (comanda?.token) {
      deactivateComanda(comanda.token);
    }
    setOrderSubmitted(true);
  };
  
  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center z-50 bg-[#F7FDF2]">
        <p className="text-red-600 p-4 text-center">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!appConfig) {
    return <LoadingScreen message="Aguardando configurações..." />;
  }

  const orderState = {
    isAuthenticated,
    comanda,
    currentStep,
    completedSteps,
    guestInfo,
    persons,
    accompaniments: orderAccompaniments,
    globalHotDishNotes,
    specialRequests,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <AppHeader config={appConfig} />

      {!isAuthenticated && <div className="h-4" />} 
      
      {isAuthenticated && !orderSubmitted && (
        <StepNavigation currentStep={currentStep} completedSteps={completedSteps} onStepClick={setStep} />
      )}

      <main className="container mx-auto p-2 md:p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2">

            {/* ETAPA 0: AUTENTICAÇÃO */}
            {currentStep === 0 && !isAuthenticated && <StepAuthAndConfirm />}
            
            {/* ETAPA 1: CONFIRMAÇÃO */}
            {isAuthenticated && currentStep === 1 && !orderSubmitted && (
              <StepConfirm deliveryTimes={deliveryTimes} />
            )}

            {/* ETAPA 2: MENSAGEM DE BOAS-VINDAS */}
            {isAuthenticated && currentStep === 2 && !orderSubmitted && (
                <StepWelcomeMessage config={appConfig} />
            )}

            {/* ETAPA 99: DETALHES (para correção) */}
            {isAuthenticated && currentStep === 99 && !orderSubmitted && (
              <StepDetails
                orderState={orderState}
                cabins={cabins}
                deliveryTimes={deliveryTimes}
                onUpdateOrderState={(updates) => updateGuestInfo(updates.guestInfo || {})}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {/* ETAPA 3: PRATOS QUENTES */}
            {isAuthenticated && currentStep === 3 && !orderSubmitted && (
              <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-card">
                <div className="text-primary-foreground p-4 md:p-6" style={{ backgroundColor: appConfig.corDestaque }}>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold">Escolha dos Pratos Quentes</h1>
                      <p className="opacity-90 mt-1 text-sm md:text-base">
                        Cada hóspede deve escolher <strong>1 prato quente</strong>. Toque no nome para ver as opções.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <GuestAccordion
                    persons={persons}
                    hotDishes={hotDishes}
                    onSelectDish={handleSelectDish}
                    onSelectFlavor={handleSelectFlavor}
                    onUpdateNotes={() => {}} 
                    onSelectNoHotDish={handleSelectNoHotDish}
                  />

                  <div className="pt-6 md:pt-8 border-t">
                    <div className="space-y-3 mb-6">
                      <label className="text-base md:text-lg font-bold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" style={{ color: appConfig.corDestaque }} />
                        Observações Gerais para Pratos Quentes
                      </label>
                      <Textarea
                        placeholder="Observações que se aplicam a todos os pratos quentes (ex: sem cebola, alergias, preferências...)"
                        value={globalHotDishNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        className="resize-none"
                        rows={4}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                      <Button variant="outline" onClick={() => setStep(2)}>← Voltar</Button>
                      <Button onClick={() => setStep(4)} className="text-primary-foreground hover:opacity-90" style={{ backgroundColor: appConfig.corDestaque }}>Próximo →</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: ACOMPANHAMENTOS */}
            {isAuthenticated && currentStep === 4 && !orderSubmitted && (
              <StepAccompaniments
                orderState={orderState}
                accompaniments={accompaniments}
                onUpdateAccompaniment={(catId, itemId, change) => handleUpdateAccompaniment(catId, itemId, change, accompaniments)}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}
            
            {/* ETAPA 5: REVISÃO */}
            {isAuthenticated && currentStep === 5 && !orderSubmitted && (
              <StepReview
                orderState={orderState}
                hotDishes={hotDishes}
                accompaniments={accompaniments}
                onBack={() => setStep(4)}
                onSuccess={handleOrderSuccess}
                onUpdateSpecialRequests={handleSpecialRequestsChange}
                onNavigateToStep={setStep}
              />
            )}
            
            {orderSubmitted && <StepSuccess />}
          </div>

          {isAuthenticated && !orderSubmitted && (
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