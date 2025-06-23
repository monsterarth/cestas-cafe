// cestas-cafe/components/step-auth-and-confirm.tsx
'use client';

import React, { useState } from 'react';
import { useOrder } from '@/hooks/use-order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const StepAuthAndConfirm = () => {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const setAuthenticated = useOrder((state) => state.setAuthenticated);

    const handleValidateToken = async () => {
        if (!token.trim()) {
            toast.error("Por favor, insira o código da sua comanda.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/validate-token/${token.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Código inválido, expirado ou já utilizado.");
            }
            
            toast.success("Comanda validada com sucesso!");
            setAuthenticated(data.comanda);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // CORREÇÃO: Adicionado um container flex para centralizar o card.
    // O 'min-h-[70vh]' garante que ele tenha espaço para se centralizar verticalmente na tela.
    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Bem-vindo(a)!</CardTitle>
                    <CardDescription>Para começar, insira o código da sua comanda abaixo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="Seu código aqui"
                            value={token}
                            onChange={(e) => setToken(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleValidateToken()}
                            className="text-center text-lg tracking-widest flex-1"
                            disabled={isLoading}
                        />
                        <Button
                            type="button"
                            size="icon"
                            onClick={handleValidateToken}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StepAuthAndConfirm;