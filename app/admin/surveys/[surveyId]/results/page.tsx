// app/admin/surveys/[surveyId]/results/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/kpi-card';
import { FeedbackList } from '@/components/feedback-list';
import { Calendar as CalendarIcon, Hash, MessageSquareText, Star, X as XIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// ATUALIZAÇÃO: Importando o componente Label que faltava
import { Label } from '@/components/ui/label';


const CategoryBarChart = dynamic(() => import('@/components/category-bar-chart'), { ssr: false, loading: () => <Skeleton className="h-96 lg:col-span-2" /> });

interface FilterOptions {
    cabins?: string[];
    countries?: string[];
    states?: string[];
    cities?: string[];
}

interface ResultsData {
    results: {
        totalResponses: number;
        overallAverage: number;
        averageByCategory: { category: string; average: number }[];
        textFeedback: string[];
    };
    filters: FilterOptions;
}

const SurveyResultsPage: React.FC = () => {
    const params = useParams();
    const surveyId = params?.surveyId as string | undefined;

    const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });
    const [selectedCabin, setSelectedCabin] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const apiUrl = useMemo(() => {
        const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : '';
        const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : '';
        
        if (!surveyId || !startDate || !endDate) return null;

        const urlParams = new URLSearchParams({ startDate, endDate });
        if (selectedCabin) urlParams.append('cabana', selectedCabin);
        if (selectedCountry) urlParams.append('pais', selectedCountry);
        if (selectedState) urlParams.append('estado', selectedState);
        if (selectedCity) urlParams.append('cidade', selectedCity);

        return `/api/surveys/${surveyId}/results?${urlParams.toString()}`;
    }, [surveyId, date, selectedCabin, selectedCountry, selectedState, selectedCity]);

    const { data, isLoading, error } = useFetchData<ResultsData>(apiUrl);
    const results = data?.results;
    const filters = data?.filters;
    
    const clearFilters = () => {
        setSelectedCabin(''); setSelectedCountry(''); setSelectedState(''); setSelectedCity('');
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold tracking-tight">Resultados da Pesquisa</h1>
                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date?.from ? (date.to ? (`${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`) : format(date.from, "LLL dd, y")) : (<span>Selecione um período</span>)}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent></Popover>
            </div>
            
            <div className="p-4 border rounded-lg bg-slate-50">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div className="col-span-2 md:col-span-1"><Label>Cabana</Label><Select value={selectedCabin} onValueChange={setSelectedCabin} disabled={!filters?.cabins}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent>{filters?.cabins?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>País</Label><Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={!filters?.countries}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{filters?.countries?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Estado</Label><Select value={selectedState} onValueChange={setSelectedState} disabled={!filters?.states}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{filters?.states?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Cidade</Label><Select value={selectedCity} onValueChange={setSelectedCity} disabled={!filters?.cities}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{filters?.cities?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <Button onClick={clearFilters} variant="ghost"><XIcon className="mr-2 h-4 w-4"/>Limpar Filtros</Button>
                </div>
            </div>

            {isLoading && (<div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>)}
            {error && <p className="text-red-500 text-center py-10">Erro ao carregar resultados: {error.message}</p>}
            
            {!isLoading && !error && results && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <KPICard title="Total de Respostas (Filtrado)" value={results.totalResponses ?? 0} icon={<Hash className="h-4 w-4 text-muted-foreground" />} />
                        <KPICard title="Nota Média Geral (Filtrado)" value={(results.overallAverage || 0).toFixed(2)} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
                        <KPICard title="Comentários Escritos (Filtrado)" value={results.textFeedback?.length ?? 0} icon={<MessageSquareText className="h-4 w-4 text-muted-foreground" />} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <CategoryBarChart data={(results.averageByCategory || []).map(item => ({ name: item.category, value: parseFloat((item.average || 0).toFixed(2)) }))} />
                        <FeedbackList feedbacks={results.textFeedback || []} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default SurveyResultsPage;