// Arquivo: components/step-auth-and-confirm.tsx
'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { Comanda } from "@/types";

export function StepAuthAndConfirm() {
    const { setAuthenticated } = useOrder();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();

    // Renomeado para não conflitar com a função de mesmo nome no escopo global
    const authenticate = async (tokenToAuth: string) => {
        if (!tokenToAuth) {
            toast.error("Por favor, insira um código de acesso.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/comandas/${tokenToAuth.toUpperCase()}`);
            const data = await response.json(); // Pega a resposta como 'any' primeiro

            if (!response.ok) {
                // CORREÇÃO: Lança um erro com a mensagem da API
                throw new Error(data.message || 'Falha na autenticação.');
            }
            
            const comandaData = data as Comanda; // Converte para o tipo Comanda após a verificação
            toast.success(`Bem-vindo(a), ${comandaData.guestName}!`);
            setAuthenticated(comandaData);

        } catch (error: any) {
            console.error("Authentication error:", error);
            toast.error(error.message || "Código inválido ou expirado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            authenticate(tokenFromUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        authenticate(token);
    };

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Acesse seu Pedido</CardTitle>
                <CardDescription>
                    Use o código de acesso (comanda) que você recebeu no check-in para começar.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">Código de Acesso</Label>
                        <Input 
                            id="token" 
                            name="token"
                            value={token}
                            onChange={(e) => setToken(e.target.value.toUpperCase())}
                            placeholder="Ex: PRAIA7"
                            className="text-center text-lg tracking-widest"
                            required
                            disabled={isLoading}
                        />
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