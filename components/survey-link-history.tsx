// components/survey-link-history.tsx
'use client';

import React from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { GeneratedSurveyLink } from '@/types/survey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
// CORREÇÃO: Importando o componente Badge que faltava
import { Badge } from '@/components/ui/badge';

interface SurveyLinkHistoryProps {
    surveyId: string;
}

export const SurveyLinkHistory = ({ surveyId }: SurveyLinkHistoryProps) => {
    const { data: links, isLoading, error } = useFetchData<GeneratedSurveyLink[]>(`/api/surveys/links?surveyId=${surveyId}`);

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
    }

    const renderContext = (context: GeneratedSurveyLink['context']) => {
        if (!context || Object.keys(context).length === 0) {
            return <Badge variant="outline">Link Genérico</Badge>;
        }
        
        return Object.entries(context)
            .filter(([, value]) => value) // Filtra campos vazios
            .map(([key, value]) => {
                const keyMap: Record<string, string> = {
                    cabinName: "Cabana", guestCount: "Hóspedes", country: "País",
                    state: "Estado", city: "Cidade", checkInDate: "Check-in", checkOutDate: "Check-out"
                };
                return <Badge key={key} variant="secondary">{keyMap[key] || key}: {value}</Badge>
            });
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (error) {
        return <p className="text-red-500">Erro ao carregar histórico de links.</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Links Gerados</CardTitle>
                <CardDescription>Aqui estão os últimos 50 links personalizados que você gerou para esta pesquisa.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {links && links.length > 0 ? links.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-3 rounded-md border bg-slate-50">
                            <div className='space-y-2'>
                                <p className="text-xs text-muted-foreground">
                                    {/* CORREÇÃO: Tratando 'createdAt' como string, que é como ele chega da API */}
                                    Gerado em: {new Date(link.createdAt as string).toLocaleString('pt-BR')}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {renderContext(link.context)}
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(link.fullUrl)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar
                            </Button>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum link personalizado foi gerado para esta pesquisa ainda.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};