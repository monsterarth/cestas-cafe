"use client";

import { useOrder } from "@/hooks/use-order";
import { Button } from "./ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, PartyPopper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function StepAuthAndConfirm() {
  const { 
    isAuthenticated, 
    comanda, 
    authenticateComanda, 
    isLoadingAuth,
    startOrder
  } = useOrder();

  const [token, setToken] = useState("");
  const searchParams = useSearchParams();

  // Efeito para autenticar automaticamente se o token vier na URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl && !isAuthenticated) {
      authenticateComanda(tokenFromUrl.toUpperCase());
    }
  }, [searchParams, isAuthenticated, authenticateComanda]);

  const handleAuth = async () => {
    if (token.length < 5) return;
    const success = await authenticateComanda(token.toUpperCase());
    if (!success) {
      alert("Comanda inválida. Por favor, verifique o código e tente novamente.");
      setToken("");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Validando sua comanda...</p>
      </div>
    );
  }

  // TELA DE CONFIRMAÇÃO (depois de autenticar)
  if (isAuthenticated && comanda) {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="items-center text-center">
                <PartyPopper className="h-12 w-12 text-amber-500" />
                <CardTitle className="text-2xl">Olá, {comanda.guestName}!</CardTitle>
                <CardDescription>Bem-vindo(a) ao nosso sistema de cestas.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-lg">
                    Seu pedido será para a <strong>{comanda.cabin}</strong> com <strong>{comanda.numberOfGuests}</strong> pessoa(s).
                </p>
                <p>Os dados estão corretos?</p>
                <Button size="lg" className="w-full" onClick={startOrder}>
                    Sim, iniciar meu pedido!
                </Button>
            </CardContent>
        </Card>
    )
  }

  // TELA DE AUTENTICAÇÃO (inicial)
  return (
    <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
            <CardTitle>Bem-Vindo(a)!</CardTitle>
            <CardDescription>
                Escaneie o QR Code ou digite o código da sua comanda para começar.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
            <InputOTP maxLength={5} value={token} onChange={(value) => setToken(value)}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                </InputOTPGroup>
            </InputOTP>
            <Button className="w-full" onClick={handleAuth} disabled={token.length < 5}>
                Confirmar Comanda
            </Button>
        </CardContent>
    </Card>
  );
}