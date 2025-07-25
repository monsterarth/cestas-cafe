'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

// Define uma interface para o tipo de dado do check-in
interface CheckIn {
    id: string;
    responsibleName: string;
    responsibleCPF: string;
    createdAt: string; // A data agora é uma string no formato ISO
    status: string;
    guests: any[];
    vehiclePlate: string;
    vehicleModel: string;
    checkInDate: string;
    checkOutDate: string;
}

export default function PreCheckInsPage() {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        async function fetchCheckIns() {
            try {
                setLoading(true);
                // A API agora retorna dados frescos e com a data formatada
                const response = await fetch('/api/pre-check-in/list');
                if (!response.ok) {
                    throw new Error('Falha ao buscar dados');
                }
                const data = await response.json();
                setCheckIns(data);
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCheckIns();
    }, []);

    const handleViewDetails = (checkIn: CheckIn) => {
        setSelectedCheckIn(checkIn);
        setIsDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        // Converte a string ISO para um objeto Date e formata para o padrão brasileiro.
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center">
                <h1 className="font-semibold text-lg md:text-2xl">Pré-Check-ins</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pré-Check-ins Recebidos</CardTitle>
                    <CardDescription>Lista de formulários de pré-check-in enviados pelos hóspedes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titular da Reserva</TableHead>
                                    <TableHead>CPF</TableHead>
                                    <TableHead>Data de Envio</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checkIns.map((checkIn) => (
                                    <TableRow key={checkIn.id}>
                                        <TableCell>{checkIn.responsibleName}</TableCell>
                                        <TableCell>{checkIn.responsibleCPF}</TableCell>
                                        {/* Usa a função para formatar a data */}
                                        <TableCell>{formatDate(checkIn.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{checkIn.status || 'recebido'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(checkIn)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver Detalhes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pré-Check-in</DialogTitle>
                        <DialogDescription>
                            Informações completas do pré-check-in de {selectedCheckIn?.responsibleName}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCheckIn && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-2">
                                <p><strong>Titular:</strong></p><p>{selectedCheckIn.responsibleName}</p>
                                <p><strong>CPF:</strong></p><p>{selectedCheckIn.responsibleCPF}</p>
                                <p><strong>Check-in:</strong></p><p>{formatDate(selectedCheckIn.checkInDate)}</p>
                                <p><strong>Check-out:</strong></p><p>{formatDate(selectedCheckIn.checkOutDate)}</p>
                                <p><strong>Placa do Veículo:</strong></p><p>{selectedCheckIn.vehiclePlate || 'N/A'}</p>
                                <p><strong>Modelo do Veículo:</strong></p><p>{selectedCheckIn.vehicleModel || 'N/A'}</p>
                            </div>
                            <h4 className="font-semibold mt-4">Acompanhantes</h4>
                            {selectedCheckIn.guests && selectedCheckIn.guests.length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {selectedCheckIn.guests.map((guest, index) => (
                                        <li key={index}>{guest.name} ({guest.cpf})</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nenhum acompanhante informado.</p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Fechar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
