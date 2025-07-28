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

    // ESTA É A FUNÇÃO CORRIGIDA
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
            const bookingsRef = firestore.collection(db, 'bookings');

            // 1. Checa fora da transação se a cabana já agendou este serviço hoje
            const cabinBookingQuery = firestore.query(bookingsRef,
                firestore.where('date', '==', dateStr),
                firestore.where('serviceId', '==', service.id),
                firestore.where('cabinName', '==', cabinName),
                firestore.where('status', '==', 'confirmado')
            );

            const cabinSnapshot = await firestore.getDocs(cabinBookingQuery);
            if (!cabinSnapshot.empty) {
                throw new Error(`A cabana ${cabinName} já agendou este serviço hoje.`);
            }

            // 2. Roda a transação para checar e agendar o horário de forma atômica
            await firestore.runTransaction(db, async (transaction) => {
                const slotQuery = firestore.query(bookingsRef,
                    firestore.where('date', '==', dateStr),
                    firestore.where('serviceId', '==', service.id),
                    firestore.where('unit', '==', unit),
                    firestore.where('timeSlotId', '==', timeSlot.id)
                );
                
                // Usa getDocs para executar a query. Não se pode passar uma query para transaction.get
                const slotSnapshot = await firestore.getDocs(slotQuery);
                const existingBookingDoc = slotSnapshot.docs.length > 0 ? slotSnapshot.docs[0] : null;

                if (existingBookingDoc) {
                    // Se um documento para o slot existe, obtemos sua referência para usar na transação
                    const existingBookingRef = firestore.doc(db, 'bookings', existingBookingDoc.id);
                    // Re-lê o documento DENTRO da transação para garantir que não houve alteração
                    const freshBookingSnap = await transaction.get(existingBookingRef);

                    if (!freshBookingSnap.exists()) {
                         throw new Error("O horário que você tenta agendar foi removido. Por favor, atualize a página.");
                    }

                    const existingBooking = freshBookingSnap.data() as Booking;
                    if (existingBooking.status === 'disponivel') {
                        // O horário estava disponível, então o confirmamos
                        transaction.update(existingBookingRef, { guestName, cabinName, status: 'confirmado', createdAt: firestore.serverTimestamp() });
                    } else {
                        // O horário foi preenchido ou bloqueado por outra transação
                        throw new Error("Desculpe, este horário acabou de ser preenchido. Por favor, escolha outro.");
                    }
                } else {
                    // Se não há documento para o horário, podemos criar um
                    if (service.defaultStatus === 'closed') {
                        throw new Error("Este horário não foi liberado pela recepção.");
                    }
                    const newBookingRef = firestore.doc(firestore.collection(db, 'bookings'));
                    transaction.set(newBookingRef, {
                        serviceId: service.id, serviceName: service.name, unit, date: dateStr, 
                        timeSlotId: timeSlot.id, timeSlotLabel: timeSlot.label,
                        guestName, cabinName, status: 'confirmado', 
                        createdAt: firestore.serverTimestamp()
                    });
                }
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

    // O JSX da página é renderizado abaixo
    return (
        <div className="container mx-auto p-4">
            <Toaster richColors position="top-center" />
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-center text-gray-800">Nossos Serviços</h1>
                <p className="text-center text-lg text-gray-500 mt-2">Escolha um serviço e agende seu horário.</p>
            </header>
            
            <div className="space-y-8">
                {services.map(service => (
                    <Card key={service.id} className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>{service.name}</CardTitle>
                            <CardDescription>
                                {service.type === 'slots' ? 'Agende um horário específico' : 'Defina sua preferência'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {service.units.map(unit => (
                                    <div key={unit} className="border rounded-lg p-4">
                                        <h4 className="font-semibold text-lg mb-3">{unit}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {service.timeSlots.map(timeSlot => {
                                                const available = isSlotAvailable(service, unit, timeSlot.id);
                                                return (
                                                    <Button
                                                        key={timeSlot.id}
                                                        variant={available ? 'outline' : 'secondary'}
                                                        disabled={!available}
                                                        onClick={() => setBookingModal({ open: true, slotInfo: { service, unit, timeSlot } })}
                                                        className={cn("w-full justify-center", !available && "cursor-not-allowed line-through")}
                                                    >
                                                        {timeSlot.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={bookingModal.open} onOpenChange={(open) => setBookingModal({ open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Agendamento</DialogTitle>
                        <DialogDescription>
                            Serviço: {bookingModal.slotInfo?.service.name} <br />
                            Unidade: {bookingModal.slotInfo?.unit} <br />
                            Horário: {bookingModal.slotInfo?.timeSlot.label}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBookingSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="guestName" className="text-right">Seu Nome</Label>
                                <Input
                                    id="guestName"
                                    value={formValues.guestName}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, guestName: e.target.value }))}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="cabinName" className="text-right">Cabana</Label>
                                <Select onValueChange={(value) => setFormValues(prev => ({ ...prev, cabinName: value }))}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione sua cabana" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cabins.sort((a, b) => (a.posicao || 0) - (b.posicao || 0)).map(cabin => (
                                            <SelectItem key={cabin.id} value={cabin.name}>{cabin.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setBookingModal({ open: false })}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}