// app/admin/surveys/page.tsx
'use client';

import React from 'react';
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
    DropdownMenuSeparator, // Importar o separador
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// ATUALIZAÇÃO: Importar os ícones de Copy e Link
import { MoreHorizontal, PlusCircle, Copy, Link as LinkIcon } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { toast } from 'sonner'; // Importar o toast para feedback

// Tipo auxiliar para os itens da lista
interface SurveyListItem extends Omit<Survey, 'questions' | 'createdAt'> {
    createdAt: { seconds: number; nanoseconds: number };
}

export default function SurveysPage() {
    const router = useRouter();
    const { data: surveys, isLoading, error } = useFetchData<SurveyListItem[]>(
        '/api/surveys'
    );

    // ATUALIZAÇÃO: Função para copiar o link da pesquisa
    const handleCopyLink = (id: string) => {
        const publicUrl = `${window.location.origin}/s/${id}`;
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link da pesquisa copiado para a área de transferência!");
    };

    if (isLoading) {
        return <LoadingScreen message="Carregando pesquisas..." />;
    }

    if (error) {
        return <div className="text-red-500">Erro ao carregar as pesquisas: {error.message}</div>;
    }

    return (
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
                            surveys.map((survey: SurveyListItem) => (
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
                                                {/* ATUALIZAÇÃO: Nova opção para copiar o link */}
                                                <DropdownMenuItem onClick={() => handleCopyLink(survey.id)}>
                                                    <LinkIcon className="mr-2 h-4 w-4" />
                                                    Copiar Link Público
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
                                                    // TODO: Implementar lógica de deleção com modal
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
    );
}