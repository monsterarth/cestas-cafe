"use client"

import React, { useState, useEffect } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Service, Booking, Cabin } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type SlotInfo = {
    service: Service;
    unit: string;
    timeSlot: any;
};

// --- PÁGINA PRINCIPAL ---
export default function GuestBookingsPage() {
    const [db, setDb] = useState<firestore.Firestore | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [cabins, setCabins] = useState<Cabin[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingModal, setBookingModal] = useState<{ open: boolean; slotInfo?: SlotInfo }>({ open: false });
    const [formValues, setFormValues] = useState({ guestName: '', cabinName: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            const firestoreDb = await getFirebaseDb();
            if (!firestoreDb) { toast.error("Falha ao conectar ao banco."); setLoading(false); return; }
            setDb(firestoreDb);

            try {
                const response = await fetch('/api/cabanas');
                if (!response.ok) throw new Error("Não foi possível carregar a lista de cabanas.");
                const data = await response.json();
                setCabins(data);
            } catch (error: any) {
                toast.error(error.message);
            }
        };
        initializeApp();
    }, []);

    useEffect(() => {
        if (!db) return;
        setLoading(true);

        const servicesQuery = firestore.query(firestore.collection(db, 'services'));
        const unsubServices = firestore.onSnapshot(servicesQuery, (snapshot) => {
            setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
        });

        const dateStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
        const bookingsQuery = firestore.query(firestore.collection(db, 'bookings'), firestore.where('date', '==', dateStr));
        const unsubBookings = firestore.onSnapshot(bookingsQuery, (snapshot) => {
            setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
            setLoading(false);
        });

        return () => { unsubServices(); unsubBookings(); };
    }, [db]);

    const isSlotAvailable = (service: Service, unit: string, timeSlotId: string): boolean => {
        const booking = bookings.find(b => 
            b.serviceId === service.id &&
            b.unit === unit &&
            b.timeSlotId === timeSlotId
        );
        
        if (booking?.status === 'confirmado' || booking?.status === 'bloqueado') {
            return false;
        }

        if (service.defaultStatus === 'closed') {
            return booking?.status === 'disponivel';
        }
        
        return !booking;
    };
    
    const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!db || !bookingModal.slotInfo) return;

        const { guestName, cabinName } = formValues;
        if (!guestName || !cabinName) {
            toast.error("Por favor, preencha seu nome e selecione a cabana.");
            return;
        }

        setIsSubmitting(true);
        const { service, unit, timeSlot } = bookingModal.slotInfo;
        const dateStr = format(startOfDay(new Date()), 'yyyy-MM-dd');

        try {
            const hasAlreadyBooked = bookings.some(b => 
                b.serviceId === service.id && 
                b.cabinName === cabinName && 
                b.status === 'confirmado'
            );
            if (hasAlreadyBooked) {
                throw new Error(`A cabana ${cabinName} já agendou este serviço hoje.`);
            }
            
            const existingAvailableBooking = bookings.find(b => 
                b.serviceId === service.id &&
                b.unit === unit &&
                b.timeSlotId === timeSlot.id &&
                b.status === 'disponivel'
            );

            if (existingAvailableBooking) {
                await firestore.deleteDoc(firestore.doc(db, 'bookings', existingAvailableBooking.id));
            }

            await firestore.addDoc(firestore.collection(db, 'bookings'), {
                serviceId: service.id, serviceName: service.name, unit, date: dateStr, 
                timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                guestName, cabinName, status: 'confirmado', 
                createdAt: firestore.serverTimestamp()
            });

            toast.success("Agendamento confirmado com sucesso!");
            setBookingModal({ open: false });
            setFormValues({ guestName: '', cabinName: '' });
        } catch (error: any) {
            toast.error(error.message || "Não foi possível realizar o agendamento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>;
    }

    return (
        <>
            <Toaster richColors position="top-center" />
            <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800">Agendamento de Serviços</h1>
                        <p className="text-muted-foreground mt-2">Escolha um serviço e um horário disponível para hoje.</p>
                    </header>

                    {services.map(service => (
                        <Card key={service.id}>
                            <CardHeader>
                                <CardTitle>{service.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {service.units.map(unit => (
                                    <div key={unit}>
                                        <h3 className="font-semibold mb-3">{unit}</h3>
                                        <div className="space-y-2">
                                            {(service.timeSlots || []).map(slot => {
                                                const available = isSlotAvailable(service, unit, slot.id);
                                                return (
                                                    <Button 
                                                        key={slot.id}
                                                        variant={available ? 'outline' : 'secondary'}
                                                        disabled={!available}
                                                        onClick={() => setBookingModal({ open: true, slotInfo: { service, unit, timeSlot: slot }})}
                                                        className="w-full justify-start"
                                                    >
                                                        {slot.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={bookingModal.open} onOpenChange={(open) => !open && setBookingModal({ open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Agendamento</DialogTitle>
                        <DialogDescription>
                            Você está agendando: <strong>{bookingModal.slotInfo?.service.name} ({bookingModal.slotInfo?.unit})</strong> para o horário das <strong>{bookingModal.slotInfo?.timeSlot.label}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="guestName">Seu Nome</Label>
                            <Input id="guestName" value={formValues.guestName} onChange={(e) => setFormValues(prev => ({...prev, guestName: e.target.value}))} />
                        </div>
                        <div>
                            <Label htmlFor="cabinName">Sua Cabana</Label>
                            <Select onValueChange={(value) => setFormValues(prev => ({...prev, cabinName: value}))}>
                                <SelectTrigger><SelectValue placeholder="Selecione sua cabana..." /></SelectTrigger>
                                <SelectContent>
                                    {cabins.length > 0 ? (
                                        cabins.map(cabin => <SelectItem key={cabin.id} value={cabin.name}>{cabin.name}</SelectItem>)
                                    ) : (
                                        <div className="p-4 text-sm text-center text-muted-foreground">Carregando cabanas...</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Agendamento
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}