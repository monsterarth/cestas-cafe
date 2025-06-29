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

    // Busca de Dados
    const { data: cabins, isLoading: loadingCabins } = useFetchData<Cabin[]>(isOpen ? '/api/cabanas' : null);
    const { data: countries, isLoading: loadingCountries, refetch: refetchCountries } = useFetchData<LocationItem[]>(isOpen ? '/api/locations/countries' : null);
    const { data: states, isLoading: loadingStates, refetch: refetchStates } = useFetchData<LocationItem[]>(selectedCountry ? `/api/locations/states?countryId=${selectedCountry}` : null);
    const { data: cities, isLoading: loadingCities, refetch: refetchCities } = useFetchData<LocationItem[]>(selectedState ? `/api/locations/cities?stateId=${selectedState}` : null);
    
    // Efeito para preparar o formulário quando o dialog abre
    useEffect(() => {
        if (isOpen) {
            setCheckOut(format(new Date(), 'yyyy-MM-dd'));
            if (countries && countries.length > 0 && !selectedCountry) {
                const brazil = countries.find(c => c.name.toLowerCase() === 'brasil');
                if (brazil) setSelectedCountry(brazil.id);
            }
        } else {
            setCabinName(''); setGuestCount(''); setCheckIn(''); setCheckOut('');
            setSelectedCountry(''); setSelectedState(''); setSelectedCity('');
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
        else if (type === 'state') { url = '/api/locations/states'; body.countryId = selectedCountry; refetch = refetchStates; }
        else if (type === 'city') { url = '/api/locations/cities'; body.stateId = selectedState; refetch = refetchCities; }
        else return;
        
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if(response.ok) refetch();
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
            if (value) params.append(key, value.toString());
        });
        
        const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        navigator.clipboard.writeText(finalUrl);
        toast.success("Link personalizado copiado!");
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Gerar Link Personalizado</DialogTitle>
                    <DialogDescription>Adicione informações da estadia para enriquecer os resultados da pesquisa. Os campos são opcionais.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-4"><h4 className="font-semibold text-sm border-b pb-2">Dados da Estadia</h4>
                        <div><Label htmlFor="cabinName">Cabana</Label><Select value={cabinName} onValueChange={setCabinName} disabled={loadingCabins}><SelectTrigger id="cabinName"><SelectValue placeholder={loadingCabins ? "Carregando..." : "Selecione a cabana"} /></SelectTrigger><SelectContent>{cabins?.map((c: Cabin) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label htmlFor="guestCount">Nº de Hóspedes</Label><Input id="guestCount" type="number" value={guestCount} onChange={e => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                        <div><Label htmlFor="checkIn">Check-in</Label><Input id="checkIn" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
                        <div><Label htmlFor="checkOut">Check-out</Label><Input id="checkOut" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
                    </div>
                    <div className="space-y-4"><h4 className="font-semibold text-sm border-b pb-2">Localização do Hóspede</h4>
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
                <DialogFooter><Button onClick={generateAndCopyLink}><Copy className="mr-2 h-4 w-4"/> Gerar e Copiar Link</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GenerateSurveyLinkDialog;