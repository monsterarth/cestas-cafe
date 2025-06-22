// Arquivo: components/comanda-management-card.tsx
'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { AppConfig, Comanda } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { usePrint } from '@/hooks/use-print';
import { toast } from 'sonner';
import { Eye, Printer, Loader2, Calendar, Users, Home, Ticket, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch'; // [NOVO] Importado o Switch

interface ComandaManagementCardProps {
    comandaData: Comanda;
    config: AppConfig | null;
    onUpdate: () => void;
}

const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

export function ComandaManagementCard({ comandaData, config, onUpdate }: ComandaManagementCardProps) {
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { printComponent, isPrinting } = usePrint();
    
    const comanda = useMemo(() => ({
        ...comandaData,
        createdAt: new Date(comandaData.createdAt as any),
        horarioLimite: comandaData.horarioLimite ? new Date(comandaData.horarioLimite as any) : null
    }), [comandaData]);

    const [editData, setEditData] = useState({
        horarioLimite: '',
        mensagemAtraso: '',
    });

    useEffect(() => {
        if (isEditDialogOpen) {
            const formattedHorario = comanda.horarioLimite && isValidDate(comanda.horarioLimite)
                ? format(comanda.horarioLimite, "yyyy-MM-dd'T'HH:mm")
                : '';
            
            setEditData({
                horarioLimite: formattedHorario,
                mensagemAtraso: comanda.mensagemAtraso || '',
            });
        }
    }, [isEditDialogOpen, comanda]);

    const handleAction = async (action: 'arquivar' | 'reativar') => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/comandas/${comanda.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (!response.ok) throw new Error('Falha ao atualizar status.');
            
            toast.success(`Comanda ${action === 'arquivar' ? 'desativada' : 'ativada'}!`);
            onUpdate();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleSaveChanges = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/comandas/${comanda.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    horarioLimite: editData.horarioLimite,
                    mensagemAtraso: editData.mensagemAtraso,
                }),
            });
             if (!response.ok) throw new Error('Falha ao salvar alterações.');

            toast.success('Validade da comanda atualizada!');
            onUpdate();
            setIsEditDialogOpen(false);
        } catch (error: any) {
            toast.error(`Falha ao salvar: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => {
        printComponent(<ComandaThermalReceipt comanda={comandaData} config={config} />);
    };

    return (
        <>
            <Card className="flex flex-col border">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="truncate pr-2">{comanda.guestName}</span>
                         <Badge variant={comanda.status === 'arquivada' ? 'secondary' : 'default'}>
                            {comanda.status === 'arquivada' ? 'Desativada' : 'Ativa'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Home className="h-3 w-3" /> 
                            <span>{comanda.cabin}</span>
                         </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                     <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-muted-foreground" /> 
                        Token: <Badge variant="outline">{comanda.token}</Badge>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{comanda.numberOfGuests} Hóspedes</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Gerada em: {isValidDate(comanda.createdAt) ? comanda.createdAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Data inválida'}</span>
                     </div>
                     {comanda.horarioLimite && isValidDate(comanda.horarioLimite) && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                           <Calendar className="h-4 w-4" />
                           <span>Expira em: {comanda.horarioLimite.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                     )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    {/* [NOVO] Switch para ativar/desativar a comanda */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`comanda-switch-${comanda.id}`}
                            checked={comanda.status !== 'arquivada'}
                            onCheckedChange={(isChecked) => handleAction(isChecked ? 'reativar' : 'arquivar')}
                            disabled={isUpdating}
                        />
                        <Label htmlFor={`comanda-switch-${comanda.id}`} className="text-sm">
                           {comanda.status !== 'arquivada' ? 'Ativa' : 'Desativada'}
                        </Label>
                    </div>

                    <div className="flex gap-2">
                         <Button variant="outline" size="icon" onClick={() => setIsViewDialogOpen(true)} disabled={isUpdating}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizar e Imprimir</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)} disabled={isUpdating}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar Validade</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-xs p-0">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle>Visualizar Comanda</DialogTitle>
                        <DialogDescription>Imprima novamente se necessário.</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 flex justify-center bg-gray-100 dark:bg-gray-800">
                        <ComandaThermalReceipt comanda={comandaData} config={config} />
                    </div>
                     <div className="p-4 pt-0 flex justify-end">
                        <Button onClick={handlePrint} disabled={isPrinting}>
                            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Imprimir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Validade da Comanda</DialogTitle>
                        <DialogDescription>Defina um prazo para o uso desta comanda. Deixe em branco para não ter limite.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor="horarioLimite">Horário Limite para Pedido</Label>
                           <Input id="horarioLimite" name="horarioLimite" type="datetime-local" value={editData.horarioLimite} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="mensagemAtraso">Mensagem para Pedidos Atrasados (Opcional)</Label>
                           <Textarea id="mensagemAtraso" name="mensagemAtraso" placeholder="Ex: Opa! O prazo para pedidos encerrou." value={editData.mensagemAtraso} onChange={handleInputChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveChanges} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}