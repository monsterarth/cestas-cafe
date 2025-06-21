// Arquivo: app/admin/comandas/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Ticket, Printer, RotateCcw } from 'lucide-react';
import { Comanda } from '@/types';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { toast } from 'sonner';

export default function ComandasPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedComanda, setGeneratedComanda] = useState<Comanda | null>(null);

    const handleGenerateComanda = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const formData = new FormData(e.currentTarget);
        const guestName = formData.get('guestName') as string;
        const cabin = formData.get('cabin') as string;
        const numberOfGuests = Number(formData.get('numberOfGuests'));

        if (!guestName || !cabin || !numberOfGuests) {
            toast.error("Por favor, preencha todos os campos.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/comandas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestName, cabin, numberOfGuests }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Falha ao gerar comanda.");
            }

            setGeneratedComanda(result);
            toast.success(`Comanda ${result.token} gerada com sucesso!`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-receipt');
        if (printContent) {
            const printableArea = document.querySelector('.printable-area');
            if (printableArea) {
                printableArea.innerHTML = ''; // Limpa a área
                printableArea.appendChild(printContent.cloneNode(true));
                window.print();
            }
        }
    };
    
    const resetForm = () => {
        setGeneratedComanda(null);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Gerador de Comandas</CardTitle>
                    <CardDescription>
                        {generatedComanda 
                            ? "Comanda gerada. Imprima ou gere uma nova." 
                            : "Preencha os dados do hóspede para criar uma nova comanda de acesso."}
                    </CardDescription>
                </CardHeader>
                {!generatedComanda ? (
                    <form onSubmit={handleGenerateComanda}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName">Nome do Hóspede</Label>
                                <Input id="guestName" name="guestName" placeholder="Ex: João da Silva" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cabin">Cabana / Quarto</Label>
                                <Input id="cabin" name="cabin" placeholder="Ex: Cabana 04" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numberOfGuests">Número de Hóspedes</Label>
                                <Input id="numberOfGuests" name="numberOfGuests" type="number" min="1" max="10" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                                Gerar Comanda
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <>
                        <CardContent>
                            <p className="text-center text-green-700 font-semibold">Comanda gerada com sucesso!</p>
                        </CardContent>
                        <CardFooter className="flex-col sm:flex-row gap-2">
                           <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir Comanda</Button>
                           <Button variant="outline" onClick={resetForm}><RotateCcw className="mr-2 h-4 w-4" />Gerar Nova</Button>
                        </CardFooter>
                    </>
                )}
            </Card>

            <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Pré-visualização</h3>
                <Card className="p-2 bg-gray-200">
                    <div id="printable-receipt">
                       {generatedComanda ? <ComandaThermalReceipt comanda={generatedComanda} /> : <div className="text-center py-20 text-gray-500">Aguardando geração da comanda...</div>}
                    </div>
                </Card>
            </div>
            {/* Div oculta para impressão, gerenciada pelo layout */}
            <div className="printable-area"></div>
        </div>
    );
}