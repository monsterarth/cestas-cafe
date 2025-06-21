// Arquivo: app/admin/comandas/gerenciar/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react'; // Adicionado useMemo
import { Comanda } from '@/types';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Archive, Save, AlertTriangle, CircleCheck, CircleX } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

function ComandaManagementCard({ comanda, onUpdate }: { comanda: Comanda, onUpdate: () => void }) {
    const [isActive, setIsActive] = useState(comanda.isActive);
    const [horarioLimite, setHorarioLimite] = useState(
        comanda.horarioLimite ? format(comanda.horarioLimite.toDate(), "yyyy-MM-dd'T'HH:mm") : ''
    );
    const [mensagemAtraso, setMensagemAtraso] = useState(comanda.mensagemAtraso || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = async (updates: Partial<Comanda>) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/comandas/${comanda.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Falha ao atualizar a comanda.');
            toast.success(`Comanda ${comanda.token} atualizada!`);
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
        const updatePayload: Partial<Comanda> = {
            mensagemAtraso: mensagemAtraso
        };
        if (horarioLimite) {
            updatePayload.horarioLimite = Timestamp.fromDate(new Date(horarioLimite));
        }
        handleUpdate(updatePayload);
    };

    const handleActiveToggle = (checked: boolean) => {
        setIsActive(checked);
        handleUpdate({ isActive: checked });
    }

    const isExpired = comanda.horarioLimite ? comanda.horarioLimite.toDate() < new Date() : false;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle>Comanda {comanda.token}</CardTitle>
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
                    <Label htmlFor={`active-switch-${comanda.id}`}>Ativar</Label>
                    <Switch
                        id={`active-switch-${comanda.id}`}
                        checked={isActive}
                        onCheckedChange={handleActiveToggle}
                        disabled={isSaving}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="bg-gray-100 p-2 rounded-md flex justify-center">
                    <ComandaThermalReceipt comanda={comanda} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`limite-${comanda.id}`}>Prazo de Utilização</Label>
                    <Input
                        id={`limite-${comanda.id}`}
                        type="datetime-local"
                        value={horarioLimite}
                        onChange={(e) => setHorarioLimite(e.target.value)}
                        disabled={isSaving}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`mensagem-${comanda.id}`}>Mensagem de Atraso</Label>
                    <Textarea
                        id={`mensagem-${comanda.id}`}
                        value={mensagemAtraso}
                        onChange={(e) => setMensagemAtraso(e.target.value)}
                        disabled={isSaving}
                        placeholder="Mensagem padrão será usada se vazio."
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleArchive} disabled={isSaving}>
                    <Archive className="mr-2 h-4 w-4" /> Arquivar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function GerenciarComandasPage() {
    const [comandas, setComandas] = useState<Comanda[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComandas = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/comandas');
            if (!response.ok) throw new Error('Falha ao buscar comandas.');
            const data = await response.json();
            setComandas(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComandas();
    }, []);

    // CORREÇÃO: Filtra as comandas no frontend para não mostrar as arquivadas.
    const comandasVisiveis = useMemo(() => {
        return comandas.filter(c => c.status !== 'arquivada');
    }, [comandas]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gerenciamento de Comandas</h1>
                <p className="text-muted-foreground">Visualize, edite e arquive as comandas geradas.</p>
            </div>
            {comandasVisiveis.length === 0 ? (
                <p>Nenhuma comanda ativa encontrada.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {comandasVisiveis.map(comanda => (
                        <ComandaManagementCard key={comanda.id} comanda={comanda} onUpdate={fetchComandas} />
                    ))}
                </div>
            )}
        </div>
    );
}