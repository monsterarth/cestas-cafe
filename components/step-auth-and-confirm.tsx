// Arquivo: components/step-auth-and-confirm.tsx
'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { Comanda } from "@/types";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

export function StepAuthAndConfirm() {
    const { setAuthenticated } = useOrder();
    const [tokenPart, setTokenPart] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();

    const authenticate = async (fullToken: string) => {
        if (!fullToken || fullToken.length < 6) {
            toast.error("Por favor, insira um código de acesso válido.");
            return;
        }
        setIsLoading(true);
        let response: Response | undefined;

        try {
            response = await fetch(`/api/comandas/${fullToken}`);
            const data = await response.json();

            if (response.status === 410) {
                toast.error("Prazo Expirado!", {
                    description: data.message,
                    duration: 10000,
                });
                throw new Error(data.message || 'Comanda expirada.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Falha na autenticação.');
            }
            
            const comandaData = data as Comanda;
            toast.success(`Bem-vindo(a), ${comandaData.guestName}!`);
            setAuthenticated(comandaData);

        } catch (error: any) {
            console.error("Authentication error:", error.message);
            if (response?.status !== 410) {
                 toast.error(error.message || "Código inválido. Tente novamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            authenticate(tokenFromUrl.toUpperCase());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tokenPart.length < 4) {
            toast.error("Por favor, preencha os 4 caracteres do código.");
            return;
        }
        const fullToken = `F-${tokenPart.toUpperCase()}`;
        authenticate(fullToken);
    };

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="items-center text-center">
                <CardTitle>Acesse seu Pedido</CardTitle>
                <CardDescription>
                    Digite o código de acesso que você recebeu no check-in.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <Label htmlFor="token">Código de Acesso</Label>
                        <InputOTP 
                            maxLength={4} 
                            value={tokenPart}
                            onChange={(value) => setTokenPart(value)}
                        >
                            <InputOTPGroup className="text-2xl">
                                <span className="font-bold text-muted-foreground mr-2">F -</span>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Verificando...' : 'Entrar'}
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}