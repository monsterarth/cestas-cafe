// components/generate-survey-link-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from 'lucide-react';
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
    // Estados internos para os campos do formulário
    const [cabinName, setCabinName] = useState('');
    const [guestCount, setGuestCount] = useState<number | ''>('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // CORREÇÃO: Buscando cabanas da API correta e apenas quando o dialog está aberto
    const { data: cabins, isLoading: loadingCabins } = useFetchData<Cabin[]>(isOpen ? '/api/cabanas' : null);
    const { data: countries, isLoading: loadingCountries, refetch: refetchCountries } = useFetchData<LocationItem[]>(isOpen ? '/api/locations/countries' : null);
    const { data: states, isLoading: loadingStates, refetch: refetchStates } = useFetchData<LocationItem[]>(isOpen && selectedCountry ? `/api/locations/states?countryId=${selectedCountry}` : null);
    const { data: cities, isLoading: loadingCities, refetch: refetchCities } = useFetchData<LocationItem[]>(isOpen && selectedState ? `/api/locations/cities?stateId=${selectedState}` : null);
    
    // Efeito para preparar e limpar o formulário
    useEffect(() => {
        if (isOpen) {
            setCheckOut(format(new Date(), 'yyyy-MM-dd')); // Seta a data de hoje
        } else {
            // Limpa tudo ao fechar para não manter dados antigos na próxima abertura
            setCabinName(''); setGuestCount(''); setCheckIn(''); setCheckOut('');
            setSelectedCountry(''); setSelectedState(''); setSelectedCity('');
        }
    }, [isOpen]);

    // Efeito para pré-selecionar o país, executado apenas uma vez quando os países carregam
    useEffect(() => {
        if (isOpen && countries && countries.length > 0 && !selectedCountry) {
            const brazil = countries.find(c => c.name.toLowerCase() === 'brasil');
            if (brazil) setSelectedCountry(brazil.id);
        }
    }, [isOpen, countries]);


    // Efeitos para limpar seleções em cascata
    useEffect(() => { if (isOpen) { setSelectedState(''); setSelectedCity(''); } }, [selectedCountry, isOpen]);
    useEffect(() => { if (isOpen) { setSelectedCity(''); } }, [selectedState, isOpen]);

    const handleAddLocation = async (type: 'country' | 'state' | 'city', name: string) => {
        let url = '';
        let body: any = { name };
        let refetch: () => void = () => {};

        if (type === 'country') { url = '/api/locations/countries'; refetch = refetchCountries; }
        else if (type === 'state') { if (!selectedCountry) { toast.error("Selecione um país primeiro."); return; } url = '/api/locations/states'; body.countryId = selectedCountry; refetch = refetchStates; }
        else if (type === 'city') { if (!selectedState) { toast.error("Selecione um estado primeiro."); return; } url = '/api/locations/cities'; body.stateId = selectedState; refetch = refetchCities; }
        else return;
        
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if(response.ok) {
          toast.success(`${Label} adicionado(a) com sucesso!`);
          refetch();
        } else {
          toast.error("Falha ao adicionar local.");
        }
    };

    const generateAndCopyLink = () => {
        if (!survey) return;
        const baseUrl = `${window.location.origin}/s/${survey.id}`;
        const params = new URLSearchParams();

        const context: SurveyResponseContext = {};
        if (cabinName) context.cabinName = cabinName;
        if (guestCount) context.guestCount = Number(guestCount);
        if (checkIn) context.checkInDate = checkIn;
        if (checkOut) context.checkOutDate = checkOut;
        const countryName = countries?.find(c => c.id === selectedCountry)?.name;
        const stateName = states?.find(s => s.id === selectedState)?.name;
        const cityName = cities?.find(c => c.id === selectedCity)?.name;
        if (countryName) context.country = countryName;
        if (stateName) context.state = stateName;
        if (cityName) context.city = cityName;
        
        Object.entries(context).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });
        
        const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        navigator.clipboard.writeText(finalUrl);
        toast.success("Link personalizado copiado!");
        onOpenChange(false);
    };

    const renderSelectWithAdd = (label: string, value: string, onValueChange: (val: string) => void, items: LocationItem[] | null, placeholder: string, loading: boolean, addHandler: (name: string) => Promise<void>, isDisabled: boolean = false) => (
        <div>
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Select value={value} onValueChange={onValueChange} disabled={isDisabled || loading || !items}>
                    <SelectTrigger><SelectValue placeholder={loading ? "Carregando..." : placeholder} /></SelectTrigger>
                    <SelectContent>{items?.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
                <AddLocationDialog title={`Adicionar ${label}`} label={`Nome do ${label}`} onSave={addHandler} />
            </div>
        </div>
    );
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Gerar Link Personalizado</DialogTitle>
                    <DialogDescription>Adicione informações da estadia para enriquecer os resultados. Os campos são opcionais.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-4"><h4 className="font-semibold text-sm border-b pb-2">Dados da Estadia</h4>
                        <div><Label htmlFor="cabinName">Cabana</Label><Select value={cabinName} onValueChange={setCabinName} disabled={loadingCabins}><SelectTrigger id="cabinName"><SelectValue placeholder={loadingCabins ? "Carregando..." : "Selecione a cabana"} /></SelectTrigger><SelectContent>{cabins?.map((c: Cabin) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label htmlFor="guestCount">Nº de Hóspedes</Label><Input id="guestCount" type="number" value={guestCount} onChange={e => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                        <div><Label htmlFor="checkIn">Check-in</Label><Input id="checkIn" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
                        <div><Label htmlFor="checkOut">Check-out</Label><Input id="checkOut" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
                    </div>
                    <div className="space-y-4"><h4 className="font-semibold text-sm border-b pb-2">Localização do Hóspede</h4>
                        {renderSelectWithAdd("País", selectedCountry, setSelectedCountry, countries, "Selecione o país", loadingCountries, (name) => handleAddLocation('country', name))}
                        {renderSelectWithAdd("Estado", selectedState, setSelectedState, states, "Selecione um país primeiro", loadingStates, (name) => handleAddLocation('state', name), !selectedCountry)}
                        {renderSelectWithAdd("Cidade", selectedCity, setSelectedCity, cities, "Selecione um estado primeiro", loadingCities, (name) => handleAddLocation('city', name), !selectedState)}
                    </div>
                </div>
                <DialogFooter><Button onClick={generateAndCopyLink}><Copy className="mr-2 h-4 w-4"/> Gerar e Copiar Link</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};