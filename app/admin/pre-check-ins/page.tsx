// cestas-cafe/app/admin/pre-check-ins/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/loading-screen';
import { AlertTriangle, Archive, ArchiveX, Dog, Eye, Phone, Clock, UserCheck, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { PreCheckIn } from '@/types';
import { toast, Toaster } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PreCheckInDetails = ({ checkInData }: { checkInData: PreCheckIn }) => {
    const leadGuest = checkInData.guests.find(g => g.isLead);

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalhes do Pré-Check-in</DialogTitle>
                <DialogDescription>
                    Informações enviadas por {leadGuest?.fullName || 'Hóspede'}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="p-4 rounded-lg bg-slate-50 border">
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><UserCheck /> Titular da Reserva</h4>
                    <p><strong>Nome:</strong> {leadGuest?.fullName}</p>
                    <p><strong>CPF:</strong> {checkInData.leadGuestCpf}</p>
                    <p><strong>Email:</strong> {checkInData.leadGuestEmail}</p>
                    <p><strong>Celular:</strong> {checkInData.leadGuestPhone}
                        <Button variant="ghost" size="sm" asChild className="ml-2">
                           <a href={`https://wa.me/55${checkInData.leadGuestPhone}`} target="_blank" rel="noopener noreferrer">
                                <Phone className="h-4 w-4 text-green-600" />
                           </a>
                        </Button>
                    </p>
                    <p><strong>Endereço:</strong> {checkInData.address}</p>
                </div>
                {checkInData.guests.filter(g => !g.isLead).length > 0 && (
                     <div className="p-4 rounded-lg bg-slate-50 border">
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Users /> Outros Hóspedes</h4>
                        <ul className="list-disc pl-5">
                            {checkInData.guests.filter(g => !g.isLead).map(g => <li key={g.fullName}>{g.fullName}</li>)}
                        </ul>
                    </div>
                )}
                <div className="p-4 rounded-lg bg-slate-50 border">
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Clock /> Detalhes da Chegada</h4>
                    <p><strong>Previsão de Chegada:</strong> {checkInData.estimatedArrivalTime}</p>
                    <p className="flex items-center gap-2"><strong>Traz Pet?</strong> {checkInData.isBringingPet ? <Dog className="h-4 w-4 text-green-600"/> : 'Não'}</p>
                </div>

                {checkInData.foodRestrictions && (
                     <div className="p-4 rounded-lg bg-amber-50 border-amber-200 border">
                        <h4 className="font-semibold flex items-center gap-2 mb-2 text-amber-800"><AlertTriangle /> Alergias / Restrições</h4>
                        <p className="whitespace-pre-wrap">{checkInData.foodRestrictions}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
};

const PreCheckInsPage: React.FC = () => {
    const { data: allCheckIns, isLoading, error, refetch } = useFetchData<PreCheckIn[]>('/api/pre-check-in/list');
    const [showArchived, setShowArchived] = useState(false);

    const handleArchive = async (id: string, currentStatus: PreCheckIn['status']) => {
        const newStatus = currentStatus === 'arquivado' ? 'recebido' : 'arquivado';
        const actionText = newStatus === 'arquivado' ? 'Arquivando' : 'Restaurando';
        
        toast.loading(`${actionText} pré-check-in...`);
        try {
            const response = await fetch(`/api/pre-check-in/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error(`Falha ao ${actionText.toLowerCase()} o item.`);
            }
            
            toast.dismiss();
            toast.success(`Pré-check-in ${newStatus === 'arquivado' ? 'arquivado' : 'restaurado'} com sucesso!`);
            refetch();
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message);
        }
    };

    const filteredCheckIns = useMemo(() => {
        if (!allCheckIns) return [];
        return allCheckIns.filter((checkin) => 
            showArchived ? checkin.status === 'arquivado' : checkin.status !== 'arquivado'
        );
    }, [allCheckIns, showArchived]);
    
    if (isLoading) {
        return <LoadingScreen message="Carregando dados de pré-check-in..." />;
    }

    if (error) {
        return <div className="text-red-500">Erro ao carregar: {error.message}</div>;
    }
    
    return (
        <Card>
            <Toaster position="top-center" richColors />
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Pré-Check-ins Recebidos</CardTitle>
                    <CardDescription>Lista de formulários de pré-check-in enviados pelos hóspedes.</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
                    <Label htmlFor="show-archived">Mostrar Arquivados</Label>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titular</TableHead>
                            <TableHead>Celular</TableHead>
                            <TableHead>Data de Envio</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCheckIns && filteredCheckIns.length > 0 ? (
                            filteredCheckIns.map((checkIn) => {
                                const leadGuest = checkIn.guests.find(g => g.isLead);
                                return (
                                <TableRow key={checkIn.id}>
                                    <TableCell className="font-medium">{leadGuest?.fullName || 'Não informado'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {checkIn.leadGuestPhone}
                                            <a href={`https://wa.me/55${checkIn.leadGuestPhone}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                                                <Phone className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* A CORREÇÃO ESTÁ AQUI */}
                                        {new Date(checkIn.createdAt).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={checkIn.status === 'recebido' ? 'default' : checkIn.status === 'arquivado' ? 'outline' : 'secondary'}>
                                            {checkIn.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" /> Ver
                                                </Button>
                                            </DialogTrigger>
                                            <PreCheckInDetails checkInData={checkIn} />
                                        </Dialog>
                                         <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleArchive(checkIn.id, checkIn.status)}>
                                            {checkIn.status === 'arquivado' ? <ArchiveX className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                                            {checkIn.status === 'arquivado' ? 'Restaurar' : 'Arquivar'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {showArchived ? 'Nenhum pré-check-in arquivado.' : 'Nenhum pré-check-in novo encontrado.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default PreCheckInsPage;