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
import { Calendar as CalendarIcon, Hash, MessageSquareText, Star } from 'lucide-react';

const CategoryBarChart = dynamic(() => import('@/components/category-bar-chart'), { ssr: false, loading: () => <Skeleton className="h-96 lg:col-span-2" /> });

interface ResultsData {
    totalResponses: number;
    overallAverage: number;
    averageByCategory: { category: string; average: number }[];
    textFeedback: string[];
}

const SurveyResultsPage: React.FC = () => {
    const params = useParams();
    const surveyId = params?.surveyId as string | undefined; // USA surveyId

    const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });

    const apiUrl = useMemo(() => {
        const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : '';
        const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : '';
        if (surveyId && startDate && endDate) { // USA surveyId
            return `/api/surveys/${surveyId}/results?startDate=${startDate}&endDate=${endDate}`; // USA surveyId
        }
        return null;
    }, [surveyId, date]); // USA surveyId

    const { data: results, isLoading, error } = useFetchData<ResultsData>(apiUrl);
    
    if (!surveyId) { return <div className="text-center text-red-500">ID da pesquisa não encontrado na URL.</div>; } // USA surveyId

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Resultados da Pesquisa</h1>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (`${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`) : format(date.from, "LLL dd, y")) : (<span>Selecione um período</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
            </div>
            {isLoading && (<div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>)}
            {error && <p className="text-red-500 text-center py-10">Erro ao carregar resultados: {error.message}</p>}
            {!isLoading && !error && results && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <KPICard title="Total de Respostas" value={results.totalResponses ?? 0} icon={<Hash className="h-4 w-4 text-muted-foreground" />} />
                        <KPICard title="Nota Média Geral" value={(results.overallAverage || 0).toFixed(2)} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
                        <KPICard title="Comentários Escritos" value={results.textFeedback?.length ?? 0} icon={<MessageSquareText className="h-4 w-4 text-muted-foreground" />} />
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