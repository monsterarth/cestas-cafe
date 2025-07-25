// Arquivo: app/admin/comandas/gerenciar/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppConfig, Comanda } from '@/types';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { ComandaManagementCard } from '@/components/comanda-management-card';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function GerenciarComandasPage() {
    const [comandas, setComandas] = useState<Comanda[]>([]);
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const fetchAllData = async () => {
        if (!isLoading) setIsLoading(true); // Mostra o spinner em re-fetchs
        try {
            const db = await getFirebaseDb();
            if (!db) throw new Error("Falha na conexão com o banco.");
            
            const [comandasRes, configSnap] = await Promise.all([
                 fetch('/api/comandas'),
                 getDoc(doc(db, "configuracoes", "app")),
            ]);

            if (!comandasRes.ok) throw new Error('Falha ao buscar comandas.');
            
            const data = await comandasRes.json();
            setComandas(data);

            if (configSnap.exists()) {
                setAppConfig(configSnap.data() as AppConfig);
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const filteredComandas = useMemo(() => {
        return comandas
            .filter(comanda => {
                const searchMatch = searchTerm === '' ||
                    comanda.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    comanda.cabin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    comanda.token.toLowerCase().includes(searchTerm.toLowerCase());

                const archiveMatch = showArchived || comanda.status !== 'arquivada';

                return searchMatch && archiveMatch;
            })
            .sort((a, b) => {
                if (a.status === 'arquivada' && b.status !== 'arquivada') return 1;
                if (a.status !== 'arquivada' && b.status === 'arquivada') return -1;
                const dateA = a.createdAt.seconds;
                const dateB = b.createdAt.seconds;
                return dateB - dateA;
            });
    }, [comandas, searchTerm, showArchived]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Gerenciamento de Comandas</h1>
                <p className="text-muted-foreground">Visualize, imprima e arquive as comandas geradas.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por hóspede, cabana ou token..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch
                        id="show-archived"
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                    />
                    <Label htmlFor="show-archived">Mostrar arquivadas</Label>
                </div>
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : filteredComandas.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                    <p>Nenhuma comanda encontrada.</p>
                    <p className="text-sm">Tente ajustar os filtros ou gere uma nova comanda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredComandas.map(comanda => (
                        <ComandaManagementCard 
                            key={comanda.id} 
                            comandaData={comanda} 
                            config={appConfig}
                            onUpdate={fetchAllData} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}