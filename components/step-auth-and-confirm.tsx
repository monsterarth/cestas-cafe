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
    const [tokenPart, setTokenPart] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();

    const authenticate = async (fullToken: string) => {
        if (!fullToken || fullToken.length < 6) {
            toast.error("Por favor, insira um código de acesso válido.");
            return;
        }
        setIsLoading(true);
        
        // MUDANÇA: A variável 'response' é declarada aqui, fora do try/catch.
        let response: Response | undefined;

        try {
            response = await fetch(`/api/comandas/${fullToken}`); // Atribuição dentro do try
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
            // Agora 'response' pode ser acessado aqui com segurança.
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
        const fullToken = `F-${tokenPart.toUpperCase()}`;
        authenticate(fullToken);
    };

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Acesse seu Pedido</CardTitle>
                <CardDescription>
                    Digite os 4 caracteres da sua comanda (ex: A1B2) que você recebeu no check-in.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">Código de Acesso</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono p-2 bg-stone-200 border border-stone-300 rounded-l-md h-10 flex items-center">F-</span>
                            <Input 
                                id="token" 
                                name="token"
                                value={tokenPart}
                                onChange={(e) => setTokenPart(e.target.value.toUpperCase())}
                                placeholder="A1B2"
                                maxLength={4}
                                className="text-center text-lg tracking-widest rounded-l-none"
                                required
                                disabled={isLoading}
                            />
                        </div>
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