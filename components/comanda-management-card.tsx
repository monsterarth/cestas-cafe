// Arquivo: components/comanda-management-card.tsx
'use client';

import { useState, useMemo } from 'react';
import { Comanda } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ComandaThermalReceipt } from './comanda-thermal-receipt';
import { toast } from 'sonner';
import { Loader2, Archive, Save, AlertTriangle, CircleCheck, CircleX, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { usePrint } from '@/hooks/use-print';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ComandaFromAPI extends Omit<Comanda, 'createdAt' | 'horarioLimite' | 'usedAt'> {
    createdAt: string;
    horarioLimite?: string | null;
    usedAt?: string | null;
}

interface ComandaManagementCardProps {
    comandaData: ComandaFromAPI;
    onUpdate: () => void;
}

export function ComandaManagementCard({ comandaData, onUpdate }: ComandaManagementCardProps) {
    const comandaDate = useMemo(() => ({
        ...comandaData,
        createdAt: new Date(comandaData.createdAt),
        horarioLimite: comandaData.horarioLimite ? new Date(comandaData.horarioLimite) : undefined,
    }), [comandaData]);

    const [isActive, setIsActive] = useState(comandaDate.isActive);
    const [horarioLimite, setHorarioLimite] = useState(
        comandaDate.horarioLimite ? format(comandaDate.horarioLimite, "yyyy-MM-dd'T'HH:mm") : ''
    );
    const [mensagemAtraso, setMensagemAtraso] = useState(comandaDate.mensagemAtraso || '');
    const [isSaving, setIsSaving] = useState(false);
    const { printComponent, isPrinting } = usePrint();

    const handleUpdate = async (updates: { [key: string]: any }) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/comandas/${comandaDate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Falha ao atualizar a comanda.');
            toast.success(`Comanda ${comandaDate.token} atualizada!`);
            onUpdate();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleArchive = () => {
        handleUpdate({ status: 'arquivada', isActive: false });
    };
    
    const handleSave = () => {
        const updatePayload: { [key: string]: any } = {
            mensagemAtraso: mensagemAtraso,
            horarioLimite: horarioLimite ? new Date(horarioLimite) : null,
        };
        handleUpdate(updatePayload);
    };

    const handleActiveToggle = (checked: boolean) => {
        setIsActive(checked);
        handleUpdate({ isActive: checked });
    }

    const handlePrint = () => {
        printComponent(<ComandaThermalReceipt comanda={receiptComanda as Comanda} />);
    };

    const isExpired = comandaDate.horarioLimite ? comandaDate.horarioLimite < new Date() : false;
    
    const receiptComanda = {
        ...comandaDate,
        createdAt: { toDate: () => comandaDate.createdAt } as any,
        horarioLimite: comandaDate.horarioLimite ? { toDate: () => comandaDate.horarioLimite } as any : undefined,
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle>Comanda {receiptComanda.token}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                        {isActive && !isExpired && <CircleCheck className="h-4 w-4 text-green-600" />}
                        {isActive && isExpired && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {!isActive && <CircleX className="h-4 w-4 text-red-600" />}
                        <span className="text-sm font-medium">
                            {isActive ? (isExpired ? 'Expirada' : 'Ativa') : 'Inativa'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Label htmlFor={`active-switch-${receiptComanda.id}`}>Ativar</Label>
                    <Switch
                        id={`active-switch-${receiptComanda.id}`}
                        checked={isActive}
                        onCheckedChange={handleActiveToggle}
                        disabled={isSaving}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="bg-gray-100 p-2 rounded-md flex justify-center">
                    <ComandaThermalReceipt comanda={receiptComanda as Comanda} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`limite-${receiptComanda.id}`}>Prazo de Utilização</Label>
                    <Input
                        id={`limite-${receiptComanda.id}`}
                        type="datetime-local"
                        value={horarioLimite}
                        onChange={(e) => setHorarioLimite(e.target.value)}
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`mensagem-${receiptComanda.id}`}>Mensagem de Atraso</Label>
                    <Textarea
                        id={`mensagem-${receiptComanda.id}`}
                        value={mensagemAtraso}
                        onChange={(e) => setMensagemAtraso(e.target.value)}
                        disabled={isSaving}
                        placeholder="Mensagem padrão será usada se vazio."
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handlePrint} disabled={isPrinting}>
                                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Imprimir Comanda</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleArchive} disabled={isSaving}>
                        <Archive className="mr-2 h-4 w-4" /> Arquivar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}