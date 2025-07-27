"use client"

import React, { useState, useEffect, useMemo } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Service, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast, Toaster } from 'sonner';
import { Calendar as CalendarIcon, Loader2, X, Lock, Unlock, User, Info } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type SlotStatusType = 'livre' | 'agendado' | 'bloqueado' | 'fechado';
type SlotStatus = {
    status: SlotStatusType;
    booking?: Booking;
};

// --- Componente de Horário ---
function TimeSlot({ service, unit, timeSlot, status, onSlotClick }: { service: Service, unit: string, timeSlot: any, status: SlotStatus, onSlotClick: () => void }) {
    const getStatusInfo = () => {
        switch (status.status) {
            case 'agendado': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <User className="h-4 w-4 mr-1" />, label: `${status.booking?.guestName} (${status.booking?.cabinName})` };
            case 'bloqueado': return { bg: 'bg-red-100', text: 'text-red-800', icon: <Lock className="h-4 w-4 mr-1" />, label: 'Bloqueado' };
            case 'fechado': return { bg: 'bg-gray-200', text: 'text-gray-600', icon: <Lock className="h-4 w-4 mr-1" />, label: 'Fechado' };
            default: return { bg: 'bg-green-100', text: 'text-green-800', icon: <Unlock className="h-4 w-4 mr-1" />, label: 'Livre' };
        }
    };
    const { bg, text, icon, label } = getStatusInfo();

    return (
        <button 
            onClick={onSlotClick}
            className={cn("w-full text-left p-2 rounded-md transition-all hover:opacity-80 flex items-center justify-between", bg, text)}
        >
            <div className="flex items-center">
                {icon}
                <span className="font-semibold text-sm">{timeSlot.label}</span>
            </div>
            <span className="text-xs truncate">{label}</span>
        </button>
    );
}


// --- Página Principal ---
export default function BookingsCalendarPage() {
    const [db, setDb] = useState<firestore.Firestore | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

    const confirmedBookings = useMemo(() => {
        return bookings
            .filter(b => b.status === 'confirmado')
            .sort((a, b) => a.timeSlotLabel.localeCompare(b.timeSlotLabel));
    }, [bookings]);

    useEffect(() => {
        const initializeDb = async () => {
            const firestoreDb = await getFirebaseDb();
            if (!firestoreDb) { toast.error("Falha ao conectar ao banco."); setLoading(false); return; }
            setDb(firestoreDb);
        };
        initializeDb();
    }, []);

    useEffect(() => {
        if (!db) return;
        setLoading(true);

        const servicesQuery = firestore.query(firestore.collection(db, 'services'));
        firestore.getDocs(servicesQuery).then(snapshot => {
            const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
            setServices(servicesData);
        });

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const bookingsQuery = firestore.query(firestore.collection(db, 'bookings'), firestore.where('date', '==', dateStr));
        const unsubscribe = firestore.onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        }, (err) => {
            toast.error("Falha ao carregar agendamentos.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, selectedDate]);

    const getSlotStatus = (service: Service, unit: string, timeSlotId: string): SlotStatus => {
        const booking = bookings.find(b => 
            b.serviceId === service.id && 
            b.unit === unit && 
            b.timeSlotId === timeSlotId
        );

        if (booking) {
            if (booking.status === 'confirmado') return { status: 'agendado', booking };
            if (booking.status === 'bloqueado') return { status: 'bloqueado', booking };
            if (booking.status === 'disponivel') return { status: 'livre', booking };
        }

        if (service.defaultStatus === 'closed') {
            return { status: 'fechado' };
        }
        
        return { status: 'livre' };
    };

    const handleSlotClick = async (service: Service, unit: string, timeSlot: any, currentStatus: SlotStatus) => {
        if (!db) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const existingBooking = currentStatus.booking;

        try {
            switch (currentStatus.status) {
                case 'fechado':
                    await firestore.addDoc(firestore.collection(db, 'bookings'), {
                        serviceId: service.id, serviceName: service.name, unit, date: dateStr, 
                        timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                        status: 'disponivel', 
                        createdAt: firestore.serverTimestamp()
                    });
                    toast.success("Horário liberado!");
                    break;

                case 'livre':
                    if (existingBooking) {
                         await firestore.updateDoc(firestore.doc(db, 'bookings', existingBooking.id), {
                            status: 'bloqueado', guestName: 'Admin', cabinName: 'Bloqueado'
                         });
                    } else {
                        await firestore.addDoc(firestore.collection(db, 'bookings'), {
                            serviceId: service.id, serviceName: service.name, unit, date: dateStr, 
                            timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                            status: 'bloqueado', guestName: 'Admin', cabinName: 'Bloqueado',
                            createdAt: firestore.serverTimestamp()
                        });
                    }
                    toast.success("Horário bloqueado!");
                    break;
                
                case 'bloqueado': 
                    if (existingBooking) await firestore.deleteDoc(firestore.doc(db, 'bookings', existingBooking.id));
                    toast.success("Horário desbloqueado!");
                    break;
                
                case 'agendado': 
                    if (!confirm(`Deseja cancelar a reserva de ${existingBooking?.guestName} (${existingBooking?.cabinName})?`)) return;
                    if (existingBooking) await firestore.deleteDoc(firestore.doc(db, 'bookings', existingBooking.id));
                    toast.success("Reserva cancelada!");
                    break;
            }
        } catch (error) {
            toast.error("Ocorreu um erro.");
        }
    };

    return (
        <>
            <Toaster richColors position="top-center" />
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Agenda de Serviços</CardTitle>
                            <CardDescription>Gerencie os agendamentos e a disponibilidade dos serviços.</CardDescription>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Agendamentos Confirmados do Dia</CardTitle>
                                <CardDescription>Lista de todos os serviços agendados para a data selecionada.</CardDescription>
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
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">Nenhum agendamento confirmado para este dia.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {services.filter(s => s.type === 'slots').map(service => (
                                <React.Fragment key={service.id}>
                                    {service.units.map(unit => (
                                        <Card key={unit}>
                                            <CardHeader>
                                                <CardTitle>{service.name}</CardTitle>
                                                <CardDescription>{unit}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {(service.timeSlots || []).map(slot => {
                                                    const status = getSlotStatus(service, unit, slot.id);
                                                    return <TimeSlot key={slot.id} service={service} unit={unit} timeSlot={slot} status={status} onSlotClick={() => handleSlotClick(service, unit, slot, status)} />
                                                })}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}