// app/admin/surveys/page.tsx
'use client';

// ATUALIZAÇÃO: Adicionar 'useState' para controlar o dialog
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
import { MoreHorizontal, PlusCircle, Link as LinkIcon, Share2 } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { toast } from 'sonner';
import { GenerateSurveyLinkDialog } from '@/components/generate-survey-link-dialog';

interface SurveyListItem extends Omit<Survey, 'questions' | 'createdAt'> {
    createdAt: { seconds: number; nanoseconds: number };
}

export default function SurveysPage() {
    const router = useRouter();
    const { data: surveys, isLoading, error } = useFetchData<SurveyListItem[]>('/api/surveys');

    // ATUALIZAÇÃO: Estado para controlar qual pesquisa está selecionada para o dialog
    const [dialogSurvey, setDialogSurvey] = useState<SurveyListItem | null>(null);

    const handleCopyGenericLink = (id: string) => {
        const publicUrl = `${window.location.origin}/s/${id}`;
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link genérico copiado para a área de transferência!");
    };

    if (isLoading) {
        return <LoadingScreen message="Carregando pesquisas..." />;
    }

    if (error) {
        return <div className="text-red-500">Erro ao carregar as pesquisas: {error.message}</div>;
    }

    return (
        // ATUALIZAÇÃO: Usa um Fragment <> para poder colocar o Dialog fora do layout principal
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
                                <TableHead className="text-right w-[80px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {surveys && surveys.length > 0 ? (
                                surveys.map((survey) => (
                                    <TableRow key={survey.id}>
                                        <TableCell className="font-medium">{survey.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={survey.isActive ? 'default' : 'outline'}>
                                                {survey.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(survey.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {/* ATUALIZAÇÃO: Este item agora apenas define o estado, não abre o dialog diretamente */}
                                                    <DropdownMenuItem onSelect={() => setDialogSurvey(survey)}>
                                                        <Share2 className="mr-2 h-4 w-4" />
                                                        Gerar Link Personalizado
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuItem onClick={() => handleCopyGenericLink(survey.id)}>
                                                        <LinkIcon className="mr-2 h-4 w-4" />
                                                        Copiar Link Genérico
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/results`)}>
                                                        Resultados
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/edit`)}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-500"
                                                        onClick={() => toast.info('Função de deletar a ser implementada.')}
                                                    >
                                                        Deletar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Nenhuma pesquisa encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ATUALIZAÇÃO: O Dialog agora vive aqui, fora do loop da tabela.
              Ele é controlado pelo estado 'dialogSurvey'.
            */}
            <GenerateSurveyLinkDialog
                isOpen={!!dialogSurvey}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogSurvey(null);
                    }
                }}
                survey={dialogSurvey}
            />
        </>
    );
}