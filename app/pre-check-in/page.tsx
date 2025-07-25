// cestas-cafe/app/pre-check-in/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
import { Loader2, Send, PartyPopper, CheckCircle, AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { useFirebaseData } from '@/hooks/use-firebase-data';
import { LoadingScreen } from '@/components/loading-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const guestSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório."),
  isLead: z.boolean().default(false),
});

const preCheckInSchema = z.object({
  leadGuestCpf: z.string().min(11, "CPF é obrigatório.").max(14, "CPF inválido."),
  leadGuestEmail: z.string().email("E-mail inválido."),
  leadGuestPhone: z.string().min(10, "Telefone é obrigatório."),
  address: z.string().min(5, "Endereço é obrigatório."),
  estimatedArrivalTime: z.string().nonempty("Previsão de chegada é obrigatória."),
  foodRestrictions: z.string().optional(),
  isBringingPet: z.boolean().default(false),
  guests: z.array(guestSchema).min(1, "É necessário adicionar pelo menos um hóspede."),
}).refine(data => data.guests.filter(g => g.isLead).length === 1, {
  message: "Por favor, marque um (e apenas um) hóspede como titular.",
  path: ["guests"],
});

type PreCheckInFormValues = z.infer<typeof preCheckInSchema>;

const PreCheckInPage: React.FC = () => {
    const { appConfig, loading: loadingConfig, error: configError } = useFirebaseData();
    const [step, setStep] = useState(0); // 0: Welcome, 1: Form, 2: Success
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showArrivalWarning, setShowArrivalWarning] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<PreCheckInFormValues>({
        resolver: zodResolver(preCheckInSchema),
        defaultValues: {
            guests: [{ fullName: '', isLead: true }],
            isBringingPet: false,
            estimatedArrivalTime: '16:00',
        },
    });
    
    const estimatedArrivalTime = useWatch({
      control,
      name: "estimatedArrivalTime"
    });

    useEffect(() => {
        if (estimatedArrivalTime && estimatedArrivalTime < "16:00") {
            setShowArrivalWarning(true);
        } else {
            setShowArrivalWarning(false);
        }
    }, [estimatedArrivalTime]);


    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "guests",
    });

    const handleLeadChange = (selectedIndex: number) => {
        fields.forEach((field, index) => {
            update(index, { ...field, isLead: index === selectedIndex });
        });
    };

    const onSubmit: SubmitHandler<PreCheckInFormValues> = async (data) => {
        setIsSubmitting(true);
        toast.loading('Enviando informações...');
        try {
            const response = await fetch('/api/pre-check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao enviar os dados.');
            }
            
            toast.dismiss();
            setStep(2); // Move to success screen
        } catch (error: any) {
            toast.dismiss();
            toast.error('Erro ao enviar', { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loadingConfig) return <LoadingScreen message="Carregando..." />;
    if (configError || !appConfig) return <div>Erro ao carregar configurações. Tente novamente.</div>

    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster position="top-center" richColors />
        <AppHeader config={appConfig} />
        <main className="container mx-auto p-4 md:p-8">
            {step === 0 && (
                 <Card className="max-w-2xl mx-auto shadow-lg">
                     <CardHeader className="text-center items-center">
                         <PartyPopper className="w-12 h-12 text-amber-500" />
                         <CardTitle className="text-2xl">Pré-Check-in Online</CardTitle>
                         <CardDescription>{appConfig.preCheckInWelcomeMessage || 'Para agilizar sua chegada, por favor, preencha algumas informações.'}</CardDescription>
                     </CardHeader>
                     <CardContent className="text-center">
                         <Button size="lg" onClick={() => setStep(1)}>Realizar Pré-Check-in</Button>
                     </CardContent>
                 </Card>
            )}

            {step === 1 && (
                 <Card className="max-w-3xl mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Formulário de Pré-Check-in</CardTitle>
                        <CardDescription>Preencha os dados abaixo. Os campos marcados com * são obrigatórios.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold">Hóspedes</h3>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex flex-col md:flex-row items-start md:items-end gap-2 p-2 bg-slate-50 rounded">
                                        <div className="flex-grow w-full">
                                            <Label htmlFor={`guests.${index}.fullName`}>Nome Completo do Hóspede {index + 1}</Label>
                                            <Input {...register(`guests.${index}.fullName`)} />
                                        </div>
                                        <div className="flex items-center gap-2 h-10">
                                            <Checkbox checked={field.isLead} onCheckedChange={() => handleLeadChange(index)} />
                                            <Label>Titular da Reserva</Label>
                                        </div>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Remover</Button>
                                        )}
                                    </div>
                                ))}
                                 {errors.guests && <p className="text-sm text-red-600">{errors.guests.message}</p>}
                                 {errors.guests?.root && <p className="text-sm text-red-600">{errors.guests.root.message}</p>}
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ fullName: '', isLead: false })}>
                                    Adicionar outro hóspede
                                </Button>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold">Informações do Titular</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><Label htmlFor="leadGuestCpf">CPF *</Label><Input id="leadGuestCpf" {...register("leadGuestCpf")} />{errors.leadGuestCpf && <p className="text-sm text-red-600">{errors.leadGuestCpf.message}</p>}</div>
                                    <div><Label htmlFor="leadGuestEmail">E-mail *</Label><Input id="leadGuestEmail" type="email" {...register("leadGuestEmail")} />{errors.leadGuestEmail && <p className="text-sm text-red-600">{errors.leadGuestEmail.message}</p>}</div>
                                </div>
                                <div>
                                    <Label htmlFor="leadGuestPhone">Celular (com DDD) *</Label>
                                    <Input id="leadGuestPhone" type="tel" {...register("leadGuestPhone")} placeholder="48999998888" />
                                    {errors.leadGuestPhone && <p className="text-sm text-red-600">{errors.leadGuestPhone.message}</p>}
                                </div>
                                <div><Label htmlFor="address">Endereço Completo *</Label><Input id="address" {...register("address")} />{errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}</div>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                 <h3 className="font-semibold">Detalhes da Viagem</h3>
                                <div>
                                    <Label htmlFor="estimatedArrivalTime">Previsão de Chegada *</Label>
                                    <Input id="estimatedArrivalTime" type="time" {...register("estimatedArrivalTime")} />
                                    {errors.estimatedArrivalTime && <p className="text-sm text-red-600">{errors.estimatedArrivalTime.message}</p>}
                                </div>
                                {showArrivalWarning && (
                                    <Alert variant="default" className="bg-amber-50 border-amber-200">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertTitle className="text-amber-800">Atenção!</AlertTitle>
                                        <AlertDescription className="text-amber-700">
                                            O horário do check in é a partir das 16h, porém caso sua cabana fique disponível antes deste horário informaremos no whatsapp do titular da reserva sobre a possibilidade de uma entrada antecipada!
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div><Label htmlFor="foodRestrictions">Intolerâncias ou Alergias Alimentares?</Label><Textarea id="foodRestrictions" {...register("foodRestrictions")} placeholder="Ex: intolerância a lactose, alergia a amendoim..." /></div>
                                <div className="flex items-center gap-2"><Checkbox id="isBringingPet" {...register("isBringingPet")} /><Label htmlFor="isBringingPet">Está trazendo um pet?</Label></div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar Informações
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
             {step === 2 && (
                <Card className="max-w-2xl mx-auto text-center shadow-lg">
                    <CardHeader>
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                        <CardTitle className="text-3xl text-green-700">Obrigado!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-lg text-stone-700">
                           Recebemos o seu pré-check-in! Caso haja alguma pendência ou queira tirar dúvidas, entre em contato conosco.
                        </p>
                        <Button 
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => window.open('https://wa.me/554899632985', '_blank')}>
                            <Phone className="mr-2 h-5 w-5" /> Chamar no WhatsApp <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
             )}
        </main>
      </div>
    );
};

export default PreCheckInPage;