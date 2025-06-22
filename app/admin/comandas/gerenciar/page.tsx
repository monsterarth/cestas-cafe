// Arquivo: app/admin/comandas/gerenciar/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Comanda } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ComandaManagementCard } from '@/components/comanda-management-card'; // <-- MUDANÇA: Importa o novo componente

// A interface agora fica no componente do card, mas a página ainda precisa dela
interface ComandaFromAPI extends Omit<Comanda, 'createdAt' | 'horarioLimite' | 'usedAt'> {
    createdAt: string;
    horarioLimite?: string | null;
    usedAt?: string | null;
}

export default function GerenciarComandasPage() {
    const [comandas, setComandas] = useState<ComandaFromAPI[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComandas = async () => {
        // Não precisa mais do setIsLoading(true) aqui, pois o estado inicial já é true
        try {
            const response = await fetch('/api/comandas');
            if (!response.ok) throw new Error('Falha ao buscar comandas.');
            const data = await response.json();
            setComandas(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComandas();
    }, []);

    const comandasVisiveis = useMemo(() => {
        return comandas.filter(c => c.status !== 'arquivada');
    }, [comandas]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gerenciamento de Comandas</h1>
                <p className="text-muted-foreground">Visualize, edite e arquive as comandas geradas.</p>
            </div>
            {comandasVisiveis.length === 0 ? (
                <p className="text-center text-muted-foreground mt-8">Nenhuma comanda ativa encontrada.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {comandasVisiveis.map(comanda => (
                        <ComandaManagementCard key={comanda.id} comandaData={comanda} onUpdate={fetchComandas} />
                    ))}
                </div>
            )}
        </div>
    );
}