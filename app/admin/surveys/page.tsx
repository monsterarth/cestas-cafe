// app/admin/surveys/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Survey } from '@/types/survey';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Link as LinkIcon, Share2, History } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { toast } from 'sonner';
import { GenerateSurveyLinkDialog } from '@/components/generate-survey-link-dialog';
import { SurveyLinkHistory } from '@/components/survey-link-history';

// CORREÇÃO: O tipo agora espera 'createdAt' como uma string.
interface SurveyListItem extends Omit<Survey, 'questions' | 'createdAt'> {
    createdAt: string;
}

export default function SurveysPage() {
    const router = useRouter();
    const { data: surveys, isLoading, error, refetch } = useFetchData<SurveyListItem[]>('/api/surveys');
    
    const [dialogSurvey, setDialogSurvey] = useState<SurveyListItem | null>(null);
    const [historySurveyId, setHistorySurveyId] = useState<string | null>(null);

    const handleCopyGenericLink = (id: string) => {
        const publicUrl = `${window.location.origin}/s/${id}`;
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link genérico copiado!");
    };
    
    const handleOpenLinkDialog = (survey: SurveyListItem) => {
        setDialogSurvey(survey);
        if(historySurveyId !== survey.id) {
            setHistorySurveyId(survey.id);
        }
    };
    
    if (isLoading) { return <LoadingScreen message="Carregando pesquisas..." />; }
    if (error) { return <div className="text-red-500">Erro ao carregar as pesquisas: {error.message}</div>; }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Suas Pesquisas</h2>
                    <Button onClick={() => router.push('/admin/surveys/create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Pesquisa
                    </Button>
                </div>

                <div className="border rounded-lg bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead className="w-[150px]">Status</TableHead>
                                <TableHead className="w-[150px]">Data Criação</TableHead>
                                <TableHead className="text-right w-[120px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {surveys && surveys.length > 0 ? (
                                surveys.map((survey) => (
                                    <TableRow key={survey.id} onClick={() => setHistorySurveyId(survey.id)} className="cursor-pointer" data-state={historySurveyId === survey.id ? 'selected' : ''}>
                                        <TableCell className="font-medium">{survey.title}</TableCell>
                                        <TableCell><Badge variant={survey.isActive ? 'default' : 'outline'}>{survey.isActive ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                                        <TableCell>
                                            {/* CORREÇÃO: Criando a data a partir da string recebida da API */}
                                            {new Date(survey.createdAt).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenLinkDialog(survey); }}>
                                                <Share2 className="h-4 w-4" />
                                                <span className="sr-only">Gerar Link Personalizado</span>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyGenericLink(survey.id); }}><LinkIcon className="mr-2 h-4 w-4" />Copiar Link Genérico</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistorySurveyId(survey.id); }}><History className="mr-2 h-4 w-4" />Ver Histórico</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/results`)}>Resultados</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/edit`)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-500" onClick={(e) => { e.stopPropagation(); toast.info('Função de deletar a ser implementada.'); }}>Deletar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (<TableRow><TableCell colSpan={5} className="text-center h-24">Nenhuma pesquisa encontrada.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
                
                {historySurveyId && (
                    <div className="mt-6">
                        <SurveyLinkHistory surveyId={historySurveyId} />
                    </div>
                )}
            </div>
            
            <GenerateSurveyLinkDialog
                isOpen={!!dialogSurvey}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogSurvey(null);
                        refetch();
                    }
                }}
                survey={dialogSurvey}
            />
        </>
    );
}