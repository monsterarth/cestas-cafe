"use client"

import React, { useState, useEffect } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Service, TimeSlot } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast, Toaster } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, ConciergeBell, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- FORMULÁRIOS E MODAIS ---

const serviceFormSchema = z.object({
    name: z.string().min(2, "O nome é obrigatório."),
    type: z.enum(['slots', 'preference']),
    defaultStatus: z.enum(['open', 'closed']),
    unitsString: z.string().min(1, "Pelo menos uma unidade é necessária."),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// Formulário para Criar/Editar um Serviço
function ServiceForm({ service, onFinished }: { service?: Service; onFinished: () => void }) {
    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: service?.name || '',
            type: service?.type || 'slots',
            defaultStatus: service?.defaultStatus || 'open',
            unitsString: service?.units.join(', ') || '',
        }
    });

    const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
        const db = await getFirebaseDb();
        if (!db) return toast.error("Banco de dados indisponível.");
        
        const units = data.unitsString.split(',').map(u => u.trim()).filter(Boolean);
        if (units.length === 0) {
            toast.error("É necessário pelo menos uma unidade.");
            return;
        }

        const serviceData = {
            name: data.name,
            type: data.type,
            defaultStatus: data.defaultStatus,
            units: units,
        };

        try {
            if (service?.id) {
                await firestore.updateDoc(firestore.doc(db, "services", service.id), serviceData);
                toast.success("Serviço atualizado com sucesso!");
            } else {
                await firestore.addDoc(firestore.collection(db, "services"), { ...serviceData, timeSlots: [] });
                toast.success("Serviço criado com sucesso!");
            }
            onFinished();
        } catch (error) {
            toast.error("Ocorreu um erro ao salvar o serviço.");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Serviço</FormLabel>
                            <FormControl><Input placeholder="Ex: Jacuzzi" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Agendamento</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="slots">Horários Fixos</SelectItem>
                                        <SelectItem value="preference">Preferência de Horário</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Diário Padrão</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="open">Aberto</SelectItem>
                                        <SelectItem value="closed">Fechado (Abertura manual)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="unitsString"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unidades (separadas por vírgula)</FormLabel>
                            <FormControl><Input placeholder="Ex: Azul clara, Azul escura" {...field} /></FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">Se houver apenas uma, digite "Única".</p>
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {service ? "Salvar Alterações" : "Criar Serviço"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

// Modal para Gerenciar Horários
function TimeSlotsManager({ service, onFinished }: { service: Service; onFinished: () => void }) {
    const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<{ slots: TimeSlot[] }>({
        defaultValues: {
            slots: service.timeSlots || []
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "slots" });

    const onSubmit: SubmitHandler<{ slots: TimeSlot[] }> = async (data) => {
        const db = await getFirebaseDb();
        if (!db) return toast.error("Banco de dados indisponível.");
        
        const formattedSlots = data.slots.map(slot => ({
            ...slot,
            id: `${slot.startTime}-${slot.endTime}`
        }));

        try {
            await firestore.updateDoc(firestore.doc(db, "services", service.id), {
                timeSlots: formattedSlots
            });
            toast.success("Horários salvos com sucesso!");
            onFinished();
        } catch (error) {
            toast.error("Ocorreu um erro ao salvar os horários.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <Input placeholder="Ex: 11:00" {...register(`slots.${index}.startTime`, { required: true })} />
                            <Input placeholder="Ex: 12:00" {...register(`slots.${index}.endTime`, { required: true })} />
                            <Input placeholder="Ex: 11h às 12h" {...register(`slots.${index}.label`, { required: true })} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ id: '', startTime: '', endTime: '', label: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Horário
            </Button>
            <DialogFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Horários
                </Button>
            </DialogFooter>
        </form>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function ManageServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [serviceModal, setServiceModal] = useState<{ open: boolean; service?: Service }>({ open: false });
    const [slotsModal, setSlotsModal] = useState<{ open: boolean; service?: Service }>({ open: false });

    useEffect(() => {
        const initializeListener = async () => {
            const db = await getFirebaseDb();
            if (!db) { toast.error("Banco de dados indisponível."); setLoading(false); return; }
            
            const q = firestore.query(firestore.collection(db, 'services'));
            const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);
                setLoading(false);
            }, (err) => {
                toast.error("Falha ao carregar serviços.");
                setLoading(false);
            });
            return () => unsubscribe();
        };
        initializeListener();
    }, []);

    const handleDeleteService = async (serviceId: string) => {
        if (!confirm("Tem certeza que deseja excluir este serviço? Todos os horários associados serão perdidos.")) return;
        const db = await getFirebaseDb();
        if (!db) return;
        try {
            await firestore.deleteDoc(firestore.doc(db, "services", serviceId));
            toast.success("Serviço excluído com sucesso!");
        } catch (error) {
            toast.error("Ocorreu um erro ao excluir o serviço.");
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <>
            <Toaster richColors position="top-center" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2"><ConciergeBell />Gerenciar Serviços Agendáveis</CardTitle>
                                <CardDescription>Crie e configure os serviços que seus hóspedes podem agendar.</CardDescription>
                            </div>
                            <Button onClick={() => setServiceModal({ open: true })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Serviço</Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <Card key={service.id}>
                            <CardHeader>
                                <CardTitle>{service.name}</CardTitle>
                                <div className="flex gap-2 pt-1">
                                    <Badge variant="secondary">{service.type === 'slots' ? 'Horários Fixos' : 'Preferência'}</Badge>
                                    <Badge variant={service.defaultStatus === 'open' ? 'default' : 'destructive'}>{service.defaultStatus === 'open' ? 'Abre Aberto' : 'Abre Fechado'}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Unidades</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {service.units.map(unit => <Badge key={unit} variant="outline">{unit}</Badge>)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Horários Definidos</h4>
                                        <p className="text-sm text-muted-foreground">{service.timeSlots?.length || 0} horários</p>
                                    </div>
                                </div>
                            </CardContent>
                            <DialogFooter className="p-4 border-t gap-2">
                                <Button size="sm" variant="outline" onClick={() => setSlotsModal({ open: true, service: service })} disabled={service.type !== 'slots'}><Clock className="mr-2 h-4 w-4"/> Horários</Button>
                                <Button size="sm" variant="outline" onClick={() => setServiceModal({ open: true, service: service })}><Edit className="mr-2 h-4 w-4"/> Editar</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}><Trash2 className="mr-2 h-4 w-4"/> Excluir</Button>
                            </DialogFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal para Criar/Editar Serviço */}
            <Dialog open={serviceModal.open} onOpenChange={(open) => !open && setServiceModal({ open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{serviceModal.service ? "Editar Serviço" : "Criar Novo Serviço"}</DialogTitle>
                        <DialogDescription>Defina as regras e informações principais deste serviço.</DialogDescription>
                    </DialogHeader>
                    <ServiceForm service={serviceModal.service} onFinished={() => setServiceModal({ open: false })} />
                </DialogContent>
            </Dialog>

            {/* Modal para Gerenciar Horários */}
            {slotsModal.service && (
                 <Dialog open={slotsModal.open} onOpenChange={(open) => !open && setSlotsModal({ open: false })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Gerenciar Horários de: {slotsModal.service.name}</DialogTitle>
                            <DialogDescription>Adicione ou remova os blocos de horário disponíveis para este serviço.</DialogDescription>
                        </DialogHeader>
                        <TimeSlotsManager service={slotsModal.service} onFinished={() => setSlotsModal({ open: false })} />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}