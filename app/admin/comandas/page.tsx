"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Comanda } from "@/types";
import { ComandaThermalReceipt } from "@/components/comanda-thermal-receipt"; // Usaremos seu componente de layout
import { Loader2, Printer } from "lucide-react";

export default function ComandasPage() {
  const [guestName, setGuestName] = useState("");
  const [cabin, setCabin] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedComanda, setGeneratedComanda] = useState<Comanda | null>(null);

  // A função de imprimir agora é uma simples chamada a window.print(),
  // exatamente como seu sistema atual deve funcionar.
  const handlePrint = () => {
    window.print();
  };

  const handleGenerateComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedComanda(null);
    try {
      const response = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName, cabin, numberOfGuests }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar comanda');
      }
      const newComanda: Comanda = await response.json();
      setGeneratedComanda(newComanda);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao gerar comanda: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Nova Comanda de Acesso</CardTitle>
          <CardDescription>
            Preencha os dados do hóspede para criar o código de acesso ao sistema de pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateComanda} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Nome do Hóspede</Label>
              <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cabin">Cabana / Quarto</Label>
              <Input id="cabin" value={cabin} onChange={(e) => setCabin(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Número de Hóspedes</Label>
              <Input id="numberOfGuests" type="number" min="1" value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : "Gerar Comanda"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedComanda && (
        <Card>
          <CardHeader>
            <CardTitle>Comanda Gerada!</CardTitle>
            <CardDescription>
              Abaixo está a pré-visualização. Clique em imprimir para o recibo térmico.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* 1. Pré-visualização que aparece na tela para o admin */}
            <div className="p-4 border rounded-lg bg-stone-100">
                <ComandaThermalReceipt comanda={generatedComanda} />
            </div>

            {/* 2. Botão que chama a impressão */}
            <Button onClick={handlePrint} size="lg">
              <Printer className="mr-2 h-5 w-5" />
              Imprimir Comanda
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. O componente que será efetivamente impresso.
             Fica 'escondido' fora da tela e usa a classe 'printable-area' que você já tem no seu CSS. */}
      {generatedComanda && (
        <div className="printable-area absolute -top-full h-0 overflow-hidden">
          <ComandaThermalReceipt comanda={generatedComanda} />
        </div>
      )}
    </div>
  );
}