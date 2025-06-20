"use client";

import { Suspense } from 'react';
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { useOrder } from "@/hooks/use-order";
import { AppHeader } from "@/components/app-header";
import { OrderSidebar } from "@/components/order-sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { StepAuthAndConfirm } from '@/components/step-auth-and-confirm';
import { StepAccompaniments } from "@/components/step-accompaniments";
import { GuestAccordion } from "@/components/guest-accordion";
import { StepReview } from "@/components/step-review";
import { StepSuccess } from "@/components/step-success";
import { Toaster } from "@/components/ui/sonner";
import { Button } from '@/components/ui/button';

function OrderPageContent() {
  const { hotDishes, accompaniments, appConfig, loading, error } = useFirebaseData();
  const orderStore = useOrder();
  
  if (loading) return <LoadingScreen />;
  if (error) return <div>Erro ao carregar dados: {error}</div>;

  const renderStep = () => {
    switch (orderStore.currentStep) {
      case 0:
      case 1:
        return <StepAuthAndConfirm />;
      
      case 2:
        return (
          <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-card">
            <div className="text-primary-foreground p-4 md:p-6" style={{ backgroundColor: appConfig?.corDestaque }}>
              <h1 className="text-xl md:text-2xl font-bold">Escolha dos Pratos Quentes</h1>
              <p className="opacity-90 mt-1 text-sm md:text-base">
                Cada hóspede deve escolher <strong>1 prato quente</strong> ou optar por não receber.
              </p>
            </div>
            <div className="space-y-4 md:space-y-6 p-4 md:p-6">
              <GuestAccordion
                  persons={orderStore.persons}
                  hotDishes={hotDishes}
                  onSelectDish={orderStore.selectHotDish}
                  onSelectFlavor={orderStore.selectHotDishFlavor}
                  onSelectNoHotDish={orderStore.selectNoHotDish}
                  onUpdateNotes={() => {}} 
              />
              <div className="flex justify-between gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={orderStore.prevStep}>← Voltar</Button>
                  <Button onClick={orderStore.nextStep}>Próximo →</Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <StepAccompaniments
            selectedAccompaniments={orderStore.accompaniments}
            accompanimentsData={accompaniments}
            onUpdateAccompaniment={orderStore.updateAccompaniment}
            totalGuests={orderStore.comanda?.numberOfGuests || 1}
            onNext={orderStore.nextStep}
            onBack={orderStore.prevStep}
          />
        );

      case 4:
        return (
          <StepReview
            orderState={orderStore}
            hotDishes={hotDishes}
            accompaniments={accompaniments}
            onBack={orderStore.prevStep}
            onSuccess={() => orderStore.setCurrentStep(5)}
            onUpdateSpecialRequests={orderStore.setSpecialRequests}
            onNavigateToStep={orderStore.setCurrentStep}
          />
        );

      case 5:
        return <StepSuccess />;

      default:
        return <div>Passo Desconhecido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
        <Toaster position="top-center" richColors />
        {appConfig && <AppHeader config={appConfig} />}
        
        <main className="container mx-auto p-2 md:p-4 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="lg:col-span-2">{renderStep()}</div>
                
                {orderStore.currentStep > 1 && orderStore.currentStep < 5 && (
                  <div className="hidden lg:block lg:col-span-1">
                      <OrderSidebar
                        orderState={orderStore} // CORREÇÃO AQUI
                        hotDishes={hotDishes}
                        accompaniments={accompaniments}
                      />
                  </div>
                )}
            </div>
        </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OrderPageContent />
    </Suspense>
  );
}