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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast, Toaster } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, ConciergeBell, Clock, ArrowRight, Sparkles, Wand2, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useForm, useFieldArray, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMinutes, format as formatTime, parse } from 'date-fns';

// --- Esquema de Validação com Zod (Atualizado para Parte 1) ---
const timeSlotSchema = z.object({
    id: z.string().optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm inválido"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:mm inválido"),
    label: z.string().min(1, "O rótulo é obrigatório"),
});

const serviceFormSchema = z.object({
    name: z.string().min(2, "O nome do serviço é obrigatório."),
    type: z.enum(['slots', 'preference'], { required_error: "Selecione um tipo." }),
    defaultStatus: z.enum(['open', 'closed'], { required_error: "Selecione um status." }),
    units: z.array(z.object({ name: z.string().min(1, "O nome da unidade não pode ser vazio.") })).min(1, "Adicione pelo menos uma unidade."),
    timeSlots: z.array(timeSlotSchema).optional(),
    additionalOptions: z.array(z.object({ name: z.string().min(1, "A opção não pode ser vazia.") })).optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// --- FORMULÁRIO UNIFICADO EM ETAPAS (Atualizado para Parte 1) ---
function ServiceFormWizard({ service, onFinished }: { service?: Service; onFinished: () => void }) {
    const [step, setStep] = useState(1);

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: service?.name || '',
            type: service?.type || 'slots',
            defaultStatus: service?.defaultStatus || 'open',
            units: service?.units.map(u => ({ name: u })) || [{ name: '' }],
            timeSlots: service?.timeSlots || [],
            additionalOptions: service?.additionalOptions?.map(o => ({ name: o })) || [{ name: '' }],
        }
    });

    const serviceType = useWatch({ control: form.control, name: 'type' });

    const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({ control: form.control, name: "units" });
    const { fields: slotFields, append: appendSlot, remove: removeSlot, replace: replaceSlots } = useFieldArray({ control: form.control, name: "timeSlots" });
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control: form.control, name: "additionalOptions" });
    
    const [generator, setGenerator] = useState({ start: '09:00', end: '18:00', duration: '60', interval: '0' });
    const handleGenerateSlots = () => {
        const slots: TimeSlot[] = [];
        let currentTime = parse(generator.start, 'HH:mm', new Date());
        const endTime = parse(generator.end, 'HH:mm', new Date());
        const duration = parseInt(generator.duration, 10);
        const interval = parseInt(generator.interval, 10);

        if (isNaN(duration) || duration <= 0) {
            toast.error("A duração deve ser um número positivo.");
            return;
        }

        while (currentTime < endTime) {
            const slotEnd = addMinutes(currentTime, duration);
            if(slotEnd > endTime) break;

            slots.push({
                startTime: formatTime(currentTime, 'HH:mm'),
                endTime: formatTime(slotEnd, 'HH:mm'),
                label: `${formatTime(currentTime, 'HH:mm')} às ${formatTime(slotEnd, 'HH:mm')}`,
                id: `${formatTime(currentTime, 'HH:mm')}-${formatTime(slotEnd, 'HH:mm')}`
            });
            currentTime = addMinutes(slotEnd, interval);
        }
        replaceSlots(slots);
        toast.success(`${slots.length} horários gerados com sucesso!`);
    };

    const processSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
        const db = await getFirebaseDb();
        if (!db) return toast.error("Banco de dados indisponível.");
        
        const serviceData = {
            name: data.name,
            type: data.type,
            defaultStatus: data.defaultStatus,
            units: data.units.map(u => u.name),
            timeSlots: data.type === 'slots' ? (data.timeSlots || []).map(slot => ({...slot, id: `${slot.startTime}-${slot.endTime}`})) : [],
            additionalOptions: data.type === 'preference' ? (data.additionalOptions?.map(o => o.name).filter(Boolean) || []) : [],
        };

        const toastId = toast.loading(service?.id ? "Atualizando serviço..." : "Criando serviço...");
        try {
            if (service?.id) {
                await firestore.updateDoc(firestore.doc(db, "services", service.id), serviceData);
                toast.success("Serviço atualizado com sucesso!", { id: toastId });
            } else {
                await firestore.addDoc(firestore.collection(db, "services"), serviceData);
                toast.success("Serviço criado com sucesso!", { id: toastId });
            }
            onFinished();
        } catch (error: any) {
            toast.error(`Ocorreu um erro: ${error.message}`, { id: toastId });
        }
    };
    
    const nextStep = async () => {
        const fieldsToValidate: any[] = step === 1 ? ['name', 'type', 'defaultStatus'] : ['units'];
        if(step === 2 && serviceType === 'preference') {
            fieldsToValidate.push('additionalOptions');
        }
        
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            if (step === 1) {
                setStep(2);
            } else if (step === 2 && serviceType === 'slots') {
                setStep(3);
            } else {
                form.handleSubmit(processSubmit)();
            }
        }
    };
    
    const maxSteps = serviceType === 'slots' ? 3 : 2;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(processSubmit)} className="flex flex-col h-full">
                <div className="flex-grow p-1 pr-4 -mr-4 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <FormField name="name" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nome do Serviço</FormLabel><FormControl><Input placeholder="Ex: Jacuzzi com Hidromassagem" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField name="type" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Tipo de Agendamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="slots">Horários Fixos</SelectItem><SelectItem value="preference">Preferência de Horário</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField name="defaultStatus" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Status Padrão Diário</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="open">Aberto</SelectItem><SelectItem value="closed">Fechado (liberação manual)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                               <h3 className="text-lg font-semibold">Unidades do Serviço</h3>
                               <p className="text-sm text-muted-foreground">Adicione as unidades, como "Jacuzzi 1", ou apenas "Única" se houver só uma.</p>
                               {unitFields.map((field, index) => (
                                   <div key={field.id} className="flex items-center gap-2">
                                       <FormField name={`units.${index}.name`} control={form.control} render={({ field }) => (
                                           <FormItem className="flex-grow"><FormControl><Input placeholder={`Unidade ${index + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                                       )} />
                                       <Button type="button" variant="ghost" size="icon" onClick={() => removeUnit(index)} disabled={unitFields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                   </div>
                               ))}
                               <Button type="button" variant="outline" size="sm" onClick={() => appendUnit({ name: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Unidade</Button>
                            </div>

                            {serviceType === 'preference' && (
                                <div className="space-y-4 pt-6 border-t">
                                    <h3 className="text-lg font-semibold">Opções Adicionais</h3>
                                    <p className="text-sm text-muted-foreground">Liste os serviços extras que o hóspede pode solicitar (ex: Troca de toalhas).</p>
                                    {optionFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField name={`additionalOptions.${index}.name`} control={form.control} render={({ field }) => (
                                                <FormItem className="flex-grow"><FormControl><Input placeholder={`Opção ${index + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={optionFields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    ))}
                                     <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ name: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção</Button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {step === 3 && serviceType === 'slots' && (
                         <div className="space-y-4">
                             <Card className="bg-muted/50">
                                <CardHeader><CardTitle className="flex items-center text-base"><Wand2 className="mr-2 h-5 w-5 text-primary"/>Gerador de Horários em Lote</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                    <div className="space-y-1"><Label htmlFor="gen-start">Início</Label><Input id="gen-start" type="time" value={generator.start} onChange={e => setGenerator(g => ({...g, start: e.target.value}))}/></div>
                                    <div className="space-y-1"><Label htmlFor="gen-end">Fim</Label><Input id="gen-end" type="time" value={generator.end} onChange={e => setGenerator(g => ({...g, end: e.target.value}))}/></div>
                                    <div className="space-y-1"><Label htmlFor="gen-duration">Duração (min)</Label><Input id="gen-duration" type="number" value={generator.duration} onChange={e => setGenerator(g => ({...g, duration: e.target.value}))}/></div>
                                    <div className="space-y-1"><Label htmlFor="gen-interval">Intervalo (min)</Label><Input id="gen-interval" type="number" value={generator.interval} onChange={e => setGenerator(g => ({...g, interval: e.target.value}))}/></div>
                                    <Button type="button" onClick={handleGenerateSlots} className="w-full">Gerar</Button>
                                </CardContent>
                            </Card>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                                {slotFields.map((field, index) => (
                                     <div key={field.id} className="flex items-center gap-2">
                                         <FormField name={`timeSlots.${index}.startTime`} control={form.control} render={({ field }) => <FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                         <FormField name={`timeSlots.${index}.endTime`} control={form.control} render={({ field }) => <FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                         <FormField name={`timeSlots.${index}.label`} control={form.control} render={({ field }) => <FormItem className="flex-1"><FormControl><Input placeholder="Rótulo (Ex: 09h às 10h)" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                     </div>
                                ))}
                            </div>
                             <Button type="button" variant="outline" size="sm" onClick={() => appendSlot({ startTime: '', endTime: '', label: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Horário Manualmente</Button>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex justify-between flex-shrink-0">
                    <div>{step > 1 && <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)}>Voltar</Button>}</div>
                    <div>
                        {step < maxSteps && <Button type="button" onClick={nextStep}>Avançar <ArrowRight className="ml-2 h-4 w-4"/></Button>}
                        {step === maxSteps && (
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                                {service ? "Salvar Alterações" : "Concluir e Criar Serviço"}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function ManageServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);

    useEffect(() => {
        const initializeListener = async () => {
            const db = await getFirebaseDb();
            if (!db) { toast.error("Banco de dados indisponível."); setLoading(false); return; }
            
            const q = firestore.query(firestore.collection(db, 'services'));
            const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);
                setLoading(false);
            }, () => { toast.error("Falha ao carregar serviços."); setLoading(false); });
            return () => unsubscribe();
        };
        initializeListener();
    }, []);

    const openModalForNew = () => {
        setEditingService(undefined);
        setIsModalOpen(true);
    };

    const openModalForEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDeleteService = async (serviceId: string, serviceName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o serviço "${serviceName}"? Esta ação é irreversível.`)) return;
        
        const db = await getFirebaseDb();
        if (!db) return;
        const toastId = toast.loading(`Excluindo ${serviceName}...`);
        try {
            await firestore.deleteDoc(firestore.doc(db, "services", serviceId));
            toast.success("Serviço excluído com sucesso!", { id: toastId });
        } catch (error) {
            toast.error("Ocorreu um erro ao excluir o serviço.", { id: toastId });
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <Toaster richColors position="top-center" />
            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><ConciergeBell />Gerenciar Serviços</CardTitle>
                        <CardDescription>Crie e configure os serviços que seus hóspedes podem agendar.</CardDescription>
                    </div>
                    <Button onClick={openModalForNew}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Novo Serviço</Button>
                </CardHeader>
            </Card>

            {services.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {services.map(service => (
                        <AccordionItem value={service.id} key={service.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className='flex justify-between items-center w-full pr-4'>
                                    <div className='flex flex-col text-left'>
                                        <span className="text-lg font-semibold">{service.name}</span>
                                        <div className="flex gap-2 pt-1">
                                            <Badge variant="secondary">{service.type === 'slots' ? 'Horários Fixos' : 'Preferência'}</Badge>
                                            <Badge variant={service.defaultStatus === 'open' ? 'default' : 'destructive'}>{service.defaultStatus === 'open' ? 'Aberto' : 'Fechado'}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openModalForEdit(service); }}><Edit className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id, service.name); }}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 bg-muted/50 rounded-b-md space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Unidades</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {service.units.map(unit => <Badge key={unit} variant="outline">{unit}</Badge>)}
                                        </div>
                                    </div>
                                    {service.type === 'slots' && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Horários</h4>
                                            {service.timeSlots && service.timeSlots.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                                    {service.timeSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                                                        <Badge key={slot.id || slot.label} variant="outline" className="flex justify-center items-center gap-2">
                                                            <Clock className="h-3 w-3" /> {slot.label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Nenhum horário definido.</p>
                                            )}
                                        </div>
                                    )}
                                     {service.type === 'preference' && (
                                         <div>
                                            <h4 className="font-semibold text-sm mb-2">Opções Adicionais Configuradas</h4>
                                            {service.additionalOptions && service.additionalOptions.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {service.additionalOptions.map(opt => (
                                                        <Badge key={opt} variant="outline" className="flex justify-center items-center gap-2">
                                                            <Wind className="h-3 w-3" /> {opt}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Nenhuma opção adicional definida.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <Card className="text-center p-12">
                    <CardDescription>Nenhum serviço foi criado ainda. Clique em "Adicionar Novo Serviço" para começar.</CardDescription>
                </Card>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-2xl">{editingService ? "Editar Serviço" : "Criar Novo Serviço"}</DialogTitle>
                        <DialogDescription>
                            {editingService ? `Editando "${editingService.name}".` : "Siga as etapas para configurar um novo serviço do zero."}
                        </DialogDescription>
                    </DialogHeader>
                    <ServiceFormWizard key={editingService?.id || 'new'} service={editingService} onFinished={() => setIsModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}