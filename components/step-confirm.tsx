// Arquivo: components/step-confirm.tsx
'use client';

import { useState } from "react";
import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Home, Users } from "lucide-react";
import { toast } from "sonner";

interface StepConfirmProps {
  deliveryTimes: string[];
}

export function StepConfirm({ deliveryTimes }: StepConfirmProps) {
  const { comanda, setStep, updateGuestInfo } = useOrder();
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!comanda) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-xl md:text-2xl font-bold text-destructive">Erro de Autenticação</h1>
        </CardHeader>
        <CardContent>
          <p>Não foi possível carregar os dados da sua reserva. Por favor, tente autenticar novamente.</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = () => {
    if (!selectedTime) {
      toast.error("Por favor, selecione um horário para a entrega.");
      return;
    }
    // Atualiza o horário e vai para a etapa 2 (Boas-Vindas)
    updateGuestInfo({ time: selectedTime });
    setStep(2);
  };

  const handleCorrect = () => {
    // Leva para a etapa 99 (Detalhes) para correção
    setStep(99);
  };
  
  return (
    <Card className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6 bg-[#97A25F]">
        <h1 className="text-xl md:text-2xl font-bold">Confirme os Dados da Reserva</h1>
        <p className="text-amber-100 mt-1 text-sm md:text-base">
          Verifique se as informações abaixo estão corretas.
        </p>
      </div>
      <CardContent className="p-6 space-y-6">
        {/* Detalhes da Reserva */}
        <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-stone-600" />
            <span className="text-md"><strong>Hóspede:</strong> {comanda.guestName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-stone-600" />
            <span className="text-md"><strong>Cabana:</strong> {comanda.cabin}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-stone-600" />
            <span className="text-md"><strong>Pessoas:</strong> {comanda.numberOfGuests}</span>
          </div>
        </div>

        {/* Seleção de Horário */}
        <fieldset>
          <legend className="text-md font-medium text-[#4B4F36] mb-3">Selecione o horário para o café:</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {deliveryTimes.map((time) => (
              <label
                key={time}
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTime === time
                    ? "border-[#97A25F] bg-[#E9D9CD] ring-2 ring-offset-1 ring-[#97A25F]"
                    : "border-[#ADA192] bg-white hover:border-[#97A25F]"
                }`}
              >
                <input
                  type="radio"
                  name="delivery-time"
                  value={time}
                  checked={selectedTime === time}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="sr-only"
                />
                <span className="font-semibold text-lg text-[#4B4F36]">{time}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Ações */}
        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 space-y-4">
            <p className="font-semibold">As informações da reserva estão corretas?</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700">Sim, continuar</Button>
                <Button onClick={handleCorrect} className="flex-1" variant="outline">Não, desejo corrigir</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}