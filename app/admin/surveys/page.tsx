// app/admin/surveys/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFetchData } from '@/hooks/use-fetch-data'; // ATUALIZADO: Usando o novo hook
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';

// Tipo auxiliar para os itens da lista, refletindo o que a API retorna
// O timestamp do Firestore é serializado como um objeto com `seconds` e `nanoseconds`
interface SurveyListItem extends Omit<Survey, 'questions' | 'createdAt'> {
    createdAt: { seconds: number; nanoseconds: number };
}

export default function SurveysPage() {
    const router = useRouter();
    // ATUALIZADO: Chamada correta para o novo hook genérico
    const { data: surveys, isLoading, error } = useFetchData<SurveyListItem[]>(
        '/api/surveys'
    );

    if (isLoading) {
        return <LoadingScreen message="Carregando pesquisas..." />;
    }

    // CORRIGIDO: Tratamento de erro, acessando a propriedade `message` do objeto Error
    if (error) {
        return <div className="text-red-500">Erro ao carregar as pesquisas: {error.message}</div>;
    }

    const handleAction = (action: 'results' | 'edit' | 'delete', id: string) => {
        if (action === 'edit') {
            router.push(`/admin/surveys/${id}/edit`);
        } else if (action === 'results') {
            router.push(`/admin/surveys/${id}/results`);
        }
        // TODO: Implementar a lógica de deleção com um modal de confirmação.
    };

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
                            // CORRIGIDO: Adicionado tipo explícito para o parâmetro `survey`
                            surveys.map((survey: SurveyListItem) => (
                                <TableRow key={survey.id}>
                                    <TableCell className="font-medium">{survey.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={survey.isActive ? 'default' : 'outline'}>
                                            {survey.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {/* CORRIGIDO: Conversão correta do timestamp serializado */}
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
                                                <DropdownMenuItem onClick={() => handleAction('results', survey.id)}>
                                                    Resultados
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction('edit', survey.id)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-500"
                                                    onClick={() => handleAction('delete', survey.id)}
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