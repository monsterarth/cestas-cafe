"use client"

import React, { useState, useEffect, useMemo } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Service, Booking, Cabin } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast, Toaster } from 'sonner';
import { Calendar as CalendarIcon, Loader2, Lock, Unlock, User, Edit, Trash2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type SlotStatusType = 'livre' | 'agendado' | 'bloqueado' | 'fechado' | 'disponivel_admin';

type SlotInfo = {
    status: SlotStatusType;
    booking?: Booking;
    service: Service;
    unit: string;
    timeSlot: { id: string, label: string };
};

// --- Componente de Horário (Slot Visual) ---
function TimeSlotDisplay({ slotInfo, onSlotClick }: { slotInfo: SlotInfo, onSlotClick: () => void }) {
    const getStatusVisuals = () => {
        switch (slotInfo.status) {
            case 'agendado': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <User className="h-4 w-4" />, label: `${slotInfo.booking?.guestName}` };
            case 'bloqueado': return { bg: 'bg-red-100', text: 'text-red-800', icon: <Lock className="h-4 w-4" />, label: 'Bloqueado' };
            case 'fechado': return { bg: 'bg-gray-200', text: 'text-gray-600', icon: <Lock className="h-4 w-4" />, label: 'Fechado' };
            case 'disponivel_admin': return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Unlock className="h-4 w-4" />, label: 'Liberado' };
            default: return { bg: 'bg-green-100', text: 'text-green-800', icon: <Unlock className="h-4 w-4" />, label: 'Livre' };
        }
    };
    const { bg, text, icon, label } = getStatusVisuals();

    return (
        <button
            onClick={onSlotClick}
            className={cn("w-full text-left p-2 rounded-md transition-all hover:opacity-90 flex items-center justify-between text-sm", bg, text)}
        >
            <div className="flex items-center font-semibold">
                {icon}
                <span className="ml-2">{slotInfo.timeSlot.label}</span>
            </div>
            <span className="text-xs truncate ml-2">{label}</span>
        </button>
    );
}

// --- Página Principal de Gerenciamento ---
export default function BookingsCalendarPage() {
    const [db, setDb] = useState<firestore.Firestore | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [cabins, setCabins] = useState<Cabin[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    
    // State para o Modal de Gerenciamento
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [editForm, setEditForm] = useState({ guestName: '', cabinName: '' });

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            const firestoreDb = await getFirebaseDb();
            if (!firestoreDb) { toast.error("Falha ao conectar ao banco."); setLoading(false); return; }
            setDb(firestoreDb);

            // Fetch das cabanas para o select do formulário
            try {
                const response = await fetch('/api/cabanas');
                if (!response.ok) throw new Error("Não foi possível carregar as cabanas.");
                setCabins(await response.json());
            } catch (error: any) {
                toast.error(error.message);
            }
        };
        initializeApp();
    }, []);

    useEffect(() => {
        if (!db) return;
        setLoading(true);

        // Listener de serviços
        const servicesQuery = firestore.query(firestore.collection(db, 'services'));
        const unsubServices = firestore.onSnapshot(servicesQuery, (snapshot) => {
            setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
        });

        // Listener de agendamentos para a data selecionada
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const bookingsQuery = firestore.query(firestore.collection(db, 'bookings'), firestore.where('date', '==', dateStr));
        const unsubBookings = firestore.onSnapshot(bookingsQuery, (snapshot) => {
            setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
            setLoading(false);
        }, () => {
            toast.error("Falha ao carregar agendamentos.");
            setLoading(false);
        });

        return () => {
            unsubServices();
            unsubBookings();
        };
    }, [db, selectedDate]);

    const confirmedBookings = useMemo(() => {
        return bookings
            .filter(b => b.status === 'confirmado')
            .sort((a, b) => a.timeSlotLabel.localeCompare(b.timeSlotLabel));
    }, [bookings]);
    
    const getSlotInfo = (service: Service, unit: string, timeSlot: { id: string; label: string; }): SlotInfo => {
        const booking = bookings.find(b =>
            b.serviceId === service.id && b.unit === unit && b.timeSlotId === timeSlot.id
        );

        let status: SlotStatusType = 'livre';
        if (booking) {
            if (booking.status === 'confirmado') status = 'agendado';
            else if (booking.status === 'bloqueado') status = 'bloqueado';
            else if (booking.status === 'disponivel') status = 'disponivel_admin';
        } else {
            if (service.defaultStatus === 'closed') status = 'fechado';
        }
        
        return { status, booking, service, unit, timeSlot };
    };
    
    // ABRIR O MODAL
    const handleSlotClick = (slotInfo: SlotInfo) => {
        setSelectedSlot(slotInfo);
        setEditForm({
            guestName: slotInfo.booking?.guestName || '',
            cabinName: slotInfo.booking?.cabinName || '',
        });
        setIsModalOpen(true);
    };

    // --- AÇÕES DO MODAL ---
    const handleModalAction = async (action: 'update' | 'create' | 'cancel' | 'block' | 'unblock' | 'release') => {
        if (!db || !selectedSlot) return;
        
        const { service, unit, timeSlot, booking } = selectedSlot;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const bookingId = booking?.id;
        const toastId = toast.loading("Processando sua solicitação...");

        try {
            if (action === 'create' || action === 'update') {
                if (!editForm.guestName || !editForm.cabinName) {
                    toast.error("Nome do hóspede e cabana são obrigatórios.", { id: toastId });
                    return;
                }
            }

            if (action === 'create') {
                const newBookingData = {
                    serviceId: service.id, serviceName: service.name, unit, date: dateStr,
                    timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                    guestName: editForm.guestName, cabinName: editForm.cabinName,
                    status: 'confirmado', createdAt: firestore.serverTimestamp()
                };
                if (bookingId) { // Se existia um doc 'disponivel', atualiza ele
                    await firestore.updateDoc(firestore.doc(db, 'bookings', bookingId), newBookingData);
                } else {
                    await firestore.addDoc(firestore.collection(db, 'bookings'), newBookingData);
                }
                toast.success("Reserva criada com sucesso!", { id: toastId });
            }
            else if (action === 'update' && bookingId) {
                await firestore.updateDoc(firestore.doc(db, 'bookings', bookingId), {
                    guestName: editForm.guestName,
                    cabinName: editForm.cabinName,
                });
                toast.success("Reserva atualizada!", { id: toastId });
            }
            else if (action === 'cancel' && bookingId) {
                await firestore.deleteDoc(firestore.doc(db, 'bookings', bookingId));
                toast.success("Reserva cancelada!", { id: toastId });
            }
            else if (action === 'block') {
                const blockData = {
                    serviceId: service.id, serviceName: service.name, unit, date: dateStr,
                    timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                    status: 'bloqueado', guestName: 'Admin', cabinName: 'Bloqueado',
                    createdAt: firestore.serverTimestamp()
                };
                if (bookingId) {
                    await firestore.updateDoc(firestore.doc(db, 'bookings', bookingId), blockData);
                } else {
                    await firestore.addDoc(firestore.collection(db, 'bookings'), blockData);
                }
                toast.success("Horário bloqueado!", { id: toastId });
            }
            else if (action === 'unblock' && bookingId) {
                 await firestore.deleteDoc(firestore.doc(db, 'bookings', bookingId));
                 toast.success("Horário desbloqueado!", { id: toastId });
            }
            else if (action === 'release') {
                const releaseData = {
                    serviceId: service.id, serviceName: service.name, unit, date: dateStr,
                    timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                    status: 'disponivel', createdAt: firestore.serverTimestamp()
                };
                await firestore.addDoc(firestore.collection(db, 'bookings'), releaseData);
                toast.success("Horário liberado para agendamento!", { id: toastId });
            }
            setIsModalOpen(false);

        } catch (error: any) {
            toast.error(`Falha na operação: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <Toaster richColors position="top-center" />
            
            {/* Cabeçalho e Calendário */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Agenda de Serviços</CardTitle>
                        <CardDescription>Gerencie os agendamentos e a disponibilidade.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full md:w-[280px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(startOfDay(date))} initialFocus />
                        </PopoverContent>
                    </Popover>
                </CardHeader>
            </Card>

            {loading ? (
                 <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {/* Tabela de Agendamentos Confirmados */}
                    <Card>
                         <CardHeader>
                             <CardTitle>Agendamentos Confirmados do Dia</CardTitle>
                         </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Horário</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Hóspede</TableHead>
                                        <TableHead>Cabana</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {confirmedBookings.length > 0 ? (
                                        confirmedBookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell>{booking.timeSlotLabel}</TableCell>
                                                <TableCell>{booking.serviceName} ({booking.unit})</TableCell>
                                                <TableCell className="font-medium">{booking.guestName}</TableCell>
                                                <TableCell>{booking.cabinName}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum agendamento para este dia.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </CardContent>
                    </Card>

                    {/* Grid de Serviços e Horários */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {services.filter(s => s.type === 'slots').map(service => (
                            <React.Fragment key={service.id}>
                                {service.units.map(unit => {
                                    const slots = (service.timeSlots || []);
                                    return (
                                        <Card key={`${service.id}-${unit}`}>
                                            <CardHeader>
                                                <CardTitle>{service.name}</CardTitle>
                                                <CardDescription>{unit}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {slots.map(slot => {
                                                    const slotInfo = getSlotInfo(service, unit, slot);
                                                    return <TimeSlotDisplay key={slot.id} slotInfo={slotInfo} onSlotClick={() => handleSlotClick(slotInfo)} />
                                                })}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </>
            )}

            {/* Modal de Gerenciamento */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerenciar Horário</DialogTitle>
                        <DialogDescription>
                            {selectedSlot?.service.name} ({selectedSlot?.unit}) - {selectedSlot?.timeSlot.label}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Formulário para criar/editar reserva */}
                    {(selectedSlot?.status === 'agendado' || selectedSlot?.status === 'livre' || selectedSlot?.status === 'disponivel_admin') && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName">Nome do Hóspede</Label>
                                <Input id="guestName" value={editForm.guestName} onChange={(e) => setEditForm(f => ({...f, guestName: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cabinName">Cabana</Label>
                                <Select value={editForm.cabinName} onValueChange={(value) => setEditForm(f => ({...f, cabinName: value}))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione uma cabana..." /></SelectTrigger>
                                    <SelectContent>
                                        {cabins.sort((a,b) => (a.posicao || 0) - (b.posicao || 0)).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Botões de Ação Dinâmicos */}
                    <DialogFooter className="flex-wrap gap-2">
                        <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose>
                        
                        {selectedSlot?.status === 'agendado' && <>
                            <Button onClick={() => handleModalAction('update')}><Edit className="h-4 w-4 mr-2" />Salvar Edição</Button>
                            <Button variant="destructive" onClick={() => handleModalAction('cancel')}><Trash2 className="h-4 w-4 mr-2" />Cancelar Reserva</Button>
                        </>}
                        
                        {(selectedSlot?.status === 'livre' || selectedSlot?.status === 'disponivel_admin') && <>
                             <Button onClick={() => handleModalAction('create')}>Criar Reserva</Button>
                             <Button variant="secondary" onClick={() => handleModalAction('block')}><Lock className="h-4 w-4 mr-2" />Bloquear</Button>
                        </>}

                        {selectedSlot?.status === 'fechado' && <Button onClick={() => handleModalAction('release')}>Liberar Horário</Button> }
                        {selectedSlot?.status === 'bloqueado' && <Button variant="secondary" onClick={() => handleModalAction('unblock')}>Desbloquear</Button> }
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}