// Arquivo: app/admin/comandas/criar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Ticket, Printer, RotateCcw, FileDown } from 'lucide-react';
import { Comanda, Cabin } from '@/types';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrint } from '@/hooks/use-print';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CriarComandaPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedComanda, setGeneratedComanda] = useState<Comanda | null>(null);
    const [cabanas, setCabanas] = useState<Cabin[]>([]);
    const { printComponent, isPrinting } = usePrint();

    useEffect(() => {
        const fetchCabanas = async () => {
            try {
                const res = await fetch('/api/cabanas');
                if (!res.ok) throw new Error("Falha ao buscar cabanas");
                const data = await res.json();
                setCabanas(data);
            } catch (error: any) {
                toast.error(error.message);
            }
        };
        fetchCabanas();
    }, []);

    const handleGenerateComanda = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            guestName: formData.get('guestName') as string,
            cabin: formData.get('cabin') as string,
            numberOfGuests: Number(formData.get('numberOfGuests')),
            horarioLimite: formData.get('horarioLimite') as string,
            mensagemAtraso: formData.get('mensagemAtraso') as string,
        };

        if (!data.guestName || !data.cabin || !data.numberOfGuests) {
            toast.error("Por favor, preencha nome, cabana e número de hóspedes.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/comandas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setGeneratedComanda(result);
            toast.success(`Comanda ${result.token} gerada com sucesso!`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!generatedComanda) return;
        printComponent(<ComandaThermalReceipt comanda={generatedComanda} />);
    };

    const resetForm = () => setGeneratedComanda(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Gerador de Comandas</CardTitle>
                    <CardDescription>
                        {generatedComanda ? "Comanda gerada. Imprima ou gere uma nova." : "Preencha os dados para criar uma comanda de acesso."}
                    </CardDescription>
                </CardHeader>
                {!generatedComanda ? (
                    <form id="comanda-form" onSubmit={handleGenerateComanda}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName">Nome do Hóspede</Label>
                                <Input id="guestName" name="guestName" placeholder="Ex: João da Silva" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cabin">Cabana / Quarto</Label>
                                    <Select name="cabin" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {cabanas.length === 0 && <div className="p-2 text-sm text-muted-foreground">Carregando...</div>}
                                            {cabanas.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="numberOfGuests">Nº de Hóspedes</Label>
                                    <Input id="numberOfGuests" name="numberOfGuests" type="number" min="1" max="10" required />
                                </div>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="horarioLimite">Horário Limite para Pedido (Opcional)</Label>
                                <Input id="horarioLimite" name="horarioLimite" type="datetime-local" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mensagemAtraso">Mensagem para Pedidos Atrasados (Opcional)</Label>
                                <Textarea id="mensagemAtraso" name="mensagemAtraso" placeholder="Ex: Opa! O limite para pedidos era até 20h..." />
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button type="submit" form="comanda-form" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                                Gerar Comanda
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <CardFooter className="flex justify-between items-center">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handlePrint} disabled={isPrinting}>
                                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Imprimir em Impressora Térmica</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                       <Button variant="secondary" onClick={resetForm}>Criar Nova</Button>
                    </CardFooter>
                )}
            </Card>
            <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Pré-visualização</h3>
                <Card className="p-2 bg-gray-200">
                    <div id="comanda-preview-area">
                        {generatedComanda ? <ComandaThermalReceipt comanda={generatedComanda} /> : <div className="text-center py-20 text-gray-500">Aguardando geração da comanda...</div>}
                    </div>
                </Card>
            </div>
        </div>
    );
}