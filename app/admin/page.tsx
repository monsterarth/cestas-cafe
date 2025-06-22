// Arquivo: app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { AppConfig, Comanda } from '@/types';
import { toast } from 'sonner';
import { AlertCircle, BarChart2, Loader2, Megaphone, ShoppingBasket, Users } from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import Link from 'next/link';

// Interface para os dados recebidos da API
interface DashboardData {
    totalCestas: number;
    totalPessoas: number;
    comandasDoDia: Comanda[]; // Usamos o tipo Comanda, mas os Timestamps virão como strings
    alertas: string[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                
                // Converte as datas de string de volta para objetos Timestamp para o componente de recibo
                dashboardData.comandasDoDia.forEach((comanda: any) => {
                    comanda.createdAt = Timestamp.fromDate(new Date(comanda.createdAt));
                    if (comanda.horarioLimite) {
                        comanda.horarioLimite = Timestamp.fromDate(new Date(comanda.horarioLimite));
                    }
                });

                setData(dashboardData);

                if (configRes.exists()) {
                    setConfig(configRes.data() as AppConfig);
                }

            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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
                        <Megaphone className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-700">{config?.mensagemDoDia || 'Tenham um ótimo dia de trabalho!'}</p>
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
                                                {/* [CORREÇÃO] Adicionada a prop 'config' que agora é obrigatória */}
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