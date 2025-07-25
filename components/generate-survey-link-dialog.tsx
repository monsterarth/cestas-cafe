// components/generate-survey-link-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Loader2 } from 'lucide-react';
import { Survey, SurveyResponseContext } from '@/types/survey';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Cabin } from '@/types';
import { format } from 'date-fns';
import { AddLocationDialog } from './add-location-dialog';

interface LocationItem { id: string; name: string; }

interface GenerateSurveyLinkDialogProps {
  survey: Pick<Survey, 'id'> | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GenerateSurveyLinkDialog = ({ survey, isOpen, onOpenChange }: GenerateSurveyLinkDialogProps) => {
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados internos para os campos do formulário
    const [cabinName, setCabinName] = useState('');
    const [guestCount, setGuestCount] = useState<number | ''>('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // Hooks para buscar os dados das APIs
    const { data: cabins, isLoading: loadingCabins } = useFetchData<Cabin[]>(isOpen ? '/api/cabanas' : null);
    const { data: countries, isLoading: loadingCountries, refetch: refetchCountries } = useFetchData<LocationItem[]>(isOpen ? '/api/locations/countries' : null);
    const { data: states, isLoading: loadingStates, refetch: refetchStates } = useFetchData<LocationItem[]>(isOpen && selectedCountry ? `/api/locations/states?countryId=${selectedCountry}` : null);
    const { data: cities, isLoading: loadingCities, refetch: refetchCities } = useFetchData<LocationItem[]>(isOpen && selectedState ? `/api/locations/cities?stateId=${selectedState}` : null);
    
    // Efeito para resetar e preparar o formulário quando o dialog abre ou fecha
    useEffect(() => {
        if (isOpen) {
            setCheckOut(format(new Date(), 'yyyy-MM-dd'));
            // Pré-seleciona "Brasil" se a lista de países já estiver carregada
            if (countries && countries.length > 0 && !selectedCountry) {
                const brazil = countries.find(c => c.name.toLowerCase() === 'brasil');
                if (brazil) setSelectedCountry(brazil.id);
            }
        } else {
            // Limpa tudo ao fechar para não manter dados antigos na próxima abertura
            setCabinName(''); setGuestCount(''); setCheckIn(''); setCheckOut('');
            setSelectedCountry(''); setSelectedState(''); setSelectedCity('');
        }
    }, [isOpen, countries]);

    // Efeitos para limpar seleções em cascata
    useEffect(() => {
        if (isOpen) {
            setSelectedState('');
            setSelectedCity('');
        }
    }, [selectedCountry, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setSelectedCity('');
        }
    }, [selectedState, isOpen]);

    // Função para adicionar um novo local (país, estado, cidade)
    const handleAddLocation = async (type: 'country' | 'state' | 'city', name: string) => {
        let url = '';
        let body: any = { name };
        let refetch: () => void = () => {};
        let label = '';

        if (type === 'country') { url = '/api/locations/countries'; refetch = refetchCountries; label = 'País'; }
        else if (type === 'state') { if (!selectedCountry) { toast.error("Selecione um país primeiro."); return; } url = '/api/locations/states'; body.countryId = selectedCountry; refetch = refetchStates; label = 'Estado'; }
        else if (type === 'city') { if (!selectedState) { toast.error("Selecione um estado primeiro."); return; } url = '/api/locations/cities'; body.stateId = selectedState; refetch = refetchCities; label = 'Cidade'; }
        else return;
        
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if(response.ok) {
          toast.success(`${label} adicionado(a) com sucesso!`);
          refetch();
        } else {
          toast.error("Falha ao adicionar local.");
        }
    };

    // Função principal que gera o link, salva no histórico e copia para o clipboard
    const generateAndCopyLink = async () => {
        if (!survey) return;
        setIsSaving(true);
        
        const baseUrl = `${window.location.origin}/s/${survey.id}`;
        const params = new URLSearchParams();
        const countryName = countries?.find(c => c.id === selectedCountry)?.name;
        const stateName = states?.find(s => s.id === selectedState)?.name;
        const cityName = cities?.find(c => c.id === selectedCity)?.name;
        
        // Monta o objeto de contexto com os dados do formulário
        const context: SurveyResponseContext = {
            cabinName: cabinName || undefined,
            guestCount: guestCount ? Number(guestCount) : undefined,
            checkInDate: checkIn || undefined,
            checkOutDate: checkOut || undefined,
            country: countryName,
            state: stateName,
            city: cityName,
        };

        // Adiciona os dados como parâmetros na URL
        Object.entries(context).forEach(([key, value]) => {
            if (value !== undefined) {
                const paramMap: Record<string, string> = {
                    cabinName: 'cabana', guestCount: 'hospedes', checkInDate: 'checkin', checkOutDate: 'checkout',
                    country: 'pais', state: 'estado', city: 'cidade'
                };
                params.append(paramMap[key] || key, String(value));
            }
        });
        
        const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        
        try {
            const saveResponse = await fetch('/api/surveys/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId: survey.id, fullUrl: finalUrl, context })
            });

            if (!saveResponse.ok) throw new Error("Falha ao salvar o link no histórico.");

            navigator.clipboard.writeText(finalUrl);
            toast.success("Link personalizado copiado e salvo no histórico!");
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Erro", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Gerar Link Personalizado</DialogTitle>
                    <DialogDescription>Adicione informações da estadia para enriquecer os resultados. Os campos são opcionais.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm border-b pb-2">Dados da Estadia</h4>
                        <div>
                            <Label htmlFor="cabinName">Cabana</Label>
                            <Select value={cabinName} onValueChange={setCabinName} disabled={loadingCabins}>
                                <SelectTrigger id="cabinName">
                                    <SelectValue placeholder={loadingCabins ? "Carregando..." : "Selecione a cabana"} />
                                </SelectTrigger>
                                <SelectContent>{cabins?.map((c: Cabin) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor="guestCount">Nº de Hóspedes</Label><Input id="guestCount" type="number" value={guestCount} onChange={e => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                        <div><Label htmlFor="checkIn">Check-in</Label><Input id="checkIn" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
                        <div><Label htmlFor="checkOut">Check-out</Label><Input id="checkOut" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm border-b pb-2">Localização do Hóspede</h4>
                        <div>
                            <Label>País</Label>
                            <div className="flex gap-2">
                                <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loadingCountries}>
                                    <SelectTrigger><SelectValue placeholder={loadingCountries ? "Carregando..." : "Selecione o país"} /></SelectTrigger>
                                    <SelectContent>{countries?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <AddLocationDialog title="Adicionar País" label="Nome do País" onSave={(name) => handleAddLocation('country', name)} />
                            </div>
                        </div>
                        <div>
                            <Label>Estado</Label>
                            <div className="flex gap-2">
                                <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedCountry || loadingStates}>
                                    <SelectTrigger><SelectValue placeholder={!selectedCountry ? "Selecione um país" : (loadingStates ? "Carregando..." : "Selecione o estado")} /></SelectTrigger>
                                    <SelectContent>{states?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <AddLocationDialog title="Adicionar Estado" label="Nome do Estado" onSave={(name) => handleAddLocation('state', name)} />
                            </div>
                        </div>
                        <div>
                            <Label>Cidade</Label>
                            <div className="flex gap-2">
                                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState || loadingCities}>
                                    <SelectTrigger><SelectValue placeholder={!selectedState ? "Selecione um estado" : (loadingCities ? "Carregando..." : "Selecione a cidade")} /></SelectTrigger>
                                    <SelectContent>{cities?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <AddLocationDialog title="Adicionar Cidade" label="Nome da Cidade" onSave={(name) => handleAddLocation('city', name)} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={generateAndCopyLink} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar e Copiar Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};