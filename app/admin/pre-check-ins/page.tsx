'use client';

import React, { useState } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/loading-screen';
import { AlertTriangle, Dog, Eye, UserCheck, Users, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

// Interface correta que corresponde aos dados do Firestore
interface Guest {
  fullName: string;
  isLead: boolean;
}

interface PreCheckIn {
  id: string;
  leadGuestCpf: string;
  leadGuestEmail: string;
  address: string;
  estimatedArrivalTime: string;
  foodRestrictions?: string;
  isBringingPet: boolean;
  guests: Guest[];
  createdAt: string; // A API já envia como string ISO
  status: 'recebido' | 'concluido';
}

// Componente de detalhes que agora usa os campos corretos
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
                    <p><strong>Endereço:</strong> {checkInData.address}</p>
                </div>
                {checkInData.guests.filter(g => !g.isLead).length > 0 && (
                     <div className="p-4 rounded-lg bg-slate-50 border">
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Users /> Outros Hóspedes</h4>
                        <ul className="list-disc pl-5">
                            {checkInData.guests.filter(g => !g.isLead).map((g, index) => <li key={index}>{g.fullName}</li>)}
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
    )
}

const PreCheckInsPage: React.FC = () => {
    const { data: checkIns, isLoading, error } = useFetchData<PreCheckIn[]>('/api/pre-check-in/list');

    if (isLoading) {
        return <LoadingScreen message="Carregando dados de pré-check-in..." />;
    }

    if (error) {
        return <div className="text-red-500">Erro ao carregar: {error.message}</div>;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pré-Check-ins Recebidos</CardTitle>
                <CardDescription>Lista de formulários de pré-check-in enviados pelos hóspedes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titular da Reserva</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Data de Envio</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {checkIns && checkIns.length > 0 ? (
                            checkIns.map((checkIn) => {
                                // Encontra o hóspede titular para exibir na tabela
                                const leadGuest = checkIn.guests.find(g => g.isLead);
                                return (
                                <TableRow key={checkIn.id}>
                                    <TableCell className="font-medium">{leadGuest?.fullName || 'Não informado'}</TableCell>
                                    <TableCell>{checkIn.leadGuestCpf}</TableCell>
                                    <TableCell>
                                        {/* A formatação da data agora funciona com a string ISO da API */}
                                        {checkIn.createdAt ? new Date(checkIn.createdAt).toLocaleString('pt-BR') : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={checkIn.status === 'recebido' ? 'default' : 'secondary'}>
                                            {checkIn.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalhes
                                                </Button>
                                            </DialogTrigger>
                                            {/* Passa o objeto de check-in completo para o modal */}
                                            <PreCheckInDetails checkInData={checkIn} />
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Nenhum pré-check-in encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default PreCheckInsPage;
