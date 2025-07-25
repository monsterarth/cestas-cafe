// cestas-cafe/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { AppConfig, Comanda } from '@/types';
import { toast } from 'sonner';
import { AlertCircle, BarChart2, Edit3, Loader2, Megaphone, Save, ShoppingBasket, Users } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface DashboardData {
    totalCestas: number;
    totalPessoas: number;
    comandasDoDia: Comanda[]; 
    alertas: string[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [isSavingMessage, setIsSavingMessage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = await getFirebaseDb();
                if (!db) throw new Error("Falha na conexão com o banco de dados");

                const [dashboardRes, configRes] = await Promise.all([
                    fetch('/api/admin/dashboard'),
                    getDoc(doc(db, 'configuracoes', 'app'))
                ]);

                if (!dashboardRes.ok) throw new Error("Falha ao buscar dados do dashboard.");
                
                const dashboardData = await dashboardRes.json();
                
                // CORREÇÃO: Removida a tentativa de converter strings ISO de volta para objetos Timestamp.
                setData(dashboardData);

                if (configRes.exists()) {
                    const configData = configRes.data() as AppConfig;
                    setConfig(configData);
                    setEditedMessage(configData.mensagemDoDia || ''); 
                }

            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const handleSaveMessage = async () => {
        setIsSavingMessage(true);
        const db = await getFirebaseDb();
        if (!db) {
            toast.error("Falha ao conectar com o banco de dados.");
            setIsSavingMessage(false);
            return;
        }
        const configRef = doc(db, 'configuracoes', 'app');
        try {
            await setDoc(configRef, { mensagemDoDia: editedMessage }, { merge: true });
            
            setConfig(prevConfig => prevConfig ? { ...prevConfig, mensagemDoDia: editedMessage } : null);
            
            toast.success("Mensagem do dia salva com sucesso!");
            setIsEditingMessage(false);
        } catch (error) {
            toast.error("Ocorreu um erro ao salvar a mensagem.");
        } finally {
            setIsSavingMessage(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedMessage(config?.mensagemDoDia || '');
        setIsEditingMessage(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cestas para Hoje</CardTitle>
                        <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.totalCestas ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Pedidos com status "Novo" ou "Em Preparação"</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Hóspedes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.totalPessoas ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Com base nos pedidos do dia</p>
                    </CardContent>
                </Card>
                 <Card className="col-span-1 md:col-span-2 bg-blue-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Mensagem do Dia</CardTitle>
                        {!isEditingMessage ? (
                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setIsEditingMessage(true)}>
                                <Edit3 className="h-4 w-4 text-blue-600" />
                            </Button>
                        ) : (
                            <Megaphone className="h-4 w-4 text-blue-600" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditingMessage ? (
                            <div className="space-y-2">
                                <Textarea 
                                    value={editedMessage}
                                    onChange={(e) => setEditedMessage(e.target.value)}
                                    className="bg-white/50"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSavingMessage}>Cancelar</Button>
                                    <Button size="sm" onClick={handleSaveMessage} disabled={isSavingMessage} className="bg-blue-600 hover:bg-blue-700">
                                        {isSavingMessage ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-blue-700 italic">"{config?.mensagemDoDia || 'Nenhuma mensagem definida.'}"</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Comandas Recentes do Dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data?.comandasDoDia && data.comandasDoDia.length > 0 ? (
                            <Carousel opts={{ align: "start", loop: false }} className="w-full">
                                <CarouselContent className="-ml-4">
                                    {data.comandasDoDia.map((comanda) => (
                                        <CarouselItem key={comanda.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                            <div className="p-1">
                                                <ComandaThermalReceipt comanda={comanda} config={config} />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        ) : (
                            <p className="text-muted-foreground">Nenhuma comanda gerada hoje.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/> Alertas e Notificações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data?.alertas && data.alertas.length > 0 ? (
                            data.alertas.map((alerta, index) => (
                                <div key={index} className="text-sm p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                                    {alerta}
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground">Nenhum alerta no momento.</p>
                        )}
                         <div className="text-sm p-2 mt-4 bg-green-50 border-l-4 border-green-400 text-green-800 rounded">
                           <Link href="/admin/pedidos/estatisticas" className="flex items-center gap-2 font-semibold hover:underline">
                                <BarChart2 size={16}/> Ver as estatísticas de pedidos
                           </Link>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}