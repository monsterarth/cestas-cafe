// Arquivo: app/admin/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order, ItemPedido } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { UtensilsCrossed, CheckCircle, Clock, Loader2, AlertTriangle, Package, CalendarDays, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderReceiptLayout } from '@/components/order-receipt-layout';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function AdminDashboardPage() {
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      const db = await getFirebaseDb();
      if (!db) {
        setError("Não foi possível conectar ao banco de dados.");
        setLoading(false);
        return;
      }

      // --- Listener para Pedidos do Dia ---
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const dailyQuery = query(
        collection(db, 'pedidos'),
        where('timestampPedido', '>=', Timestamp.fromDate(today)),
        where('timestampPedido', '<', Timestamp.fromDate(tomorrow)),
        orderBy('timestampPedido', 'desc')
      );
      const unsubscribeDaily = onSnapshot(dailyQuery, 
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setDailyOrders(ordersData);
        },
        (err) => {
          console.error("Erro nos pedidos diários:", err);
          setError("Falha ao carregar os pedidos do dia.");
        }
      );

      // --- Busca Única para Pedidos do Mês ---
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyQuery = query(
        collection(db, 'pedidos'),
        where('timestampPedido', '>=', Timestamp.fromDate(startOfMonth))
      );
      const unsubscribeMonthly = onSnapshot(monthlyQuery,
        (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setMonthlyOrders(ordersData);
            setLoading(false);
        },
        (err) => {
            console.error("Erro nos pedidos mensais:", err);
            setError("Falha ao carregar as estatísticas do mês.");
            setLoading(false);
        }
      );
      
      return () => {
        unsubscribeDaily();
        unsubscribeMonthly();
      };
    };

    fetchOrders();
  }, []);

  // --- Lógica da Mensagem do Dia ---
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const storedData = localStorage.getItem('dailyMessage');
    let message = "";

    if (storedData) {
        const { date, msg } = JSON.parse(storedData);
        if (date === todayStr) {
            message = msg;
        }
    }
    
    // Se não houver mensagem ou a data for diferente, busque uma nova
    if (!message) {
        // Esta é uma simulação, o ideal é buscar do config do Firebase
        const allMessages = ["Que seu dia seja tão incrível quanto o aroma de um café fresquinho.", "Um sorriso pode mudar o mundo. Comece pelo seu!", "A gentileza é como o açúcar, deixa tudo mais doce."];
        message = allMessages[Math.floor(Math.random() * allMessages.length)];
        localStorage.setItem('dailyMessage', JSON.stringify({ date: todayStr, msg: message }));
    }
    setDailyMessage(message);
  }, []);

  const dailyMetrics = useMemo(() => {
    const deliveryTimeSummary = dailyOrders.reduce((acc, order) => {
      const time = order.horarioEntrega;
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBaskets: dailyOrders.length,
      totalDiners: dailyOrders.reduce((acc, o) => acc + o.numeroPessoas, 0),
      deliveryTimeSummary
    };
  }, [dailyOrders]);
  
  const monthlyMetrics = useMemo(() => {
    if (monthlyOrders.length === 0) return null;
    
    const allItems = monthlyOrders.flatMap(o => o.itensPedido);
    const topItems = allItems.reduce((acc, item) => {
        acc[item.nomeItem] = (acc[item.nomeItem] || 0) + item.quantidade;
        return acc;
    }, {} as Record<string, number>);

    const topItemsData = Object.entries(topItems)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, Quantidade: value }));
        
    return {
        totalBasketsMonth: monthlyOrders.length,
        topItemsData
    };
  }, [monthlyOrders]);

  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando Dashboard...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">{error}</h2></div>;

  return (
    <div className="flex flex-col gap-8">
        {/* SEÇÃO 1: VISÃO GERAL DO DIA */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cestas para Hoje</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{dailyMetrics.totalBaskets}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comensais Hoje</CardTitle><UtensilsCrossed className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{dailyMetrics.totalDiners}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entregas por Horário</CardTitle></CardHeader>
                <CardContent>
                    {Object.keys(dailyMetrics.deliveryTimeSummary).length > 0 ? (
                        Object.entries(dailyMetrics.deliveryTimeSummary).map(([time, count]) => (
                            <div key={time} className="text-xs">{time}: <span className="font-bold">{count} cesta(s)</span></div>
                        ))
                    ) : <p className="text-xs text-muted-foreground">Nenhuma entrega agendada.</p>}
                </CardContent>
            </Card>
        </div>
        
        {/* SEÇÃO 2: MENSAGEM E RESUMO DE ITENS */}
        <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center p-6">
                <p className="text-lg italic text-yellow-800 text-center">"{dailyMessage}"</p>
            </div>
            <Card className="md:col-span-3">
                <CardHeader><CardTitle>Comandas do Dia</CardTitle><CardDescription>Navegue pelas comandas individuais de hoje.</CardDescription></CardHeader>
                <CardContent>
                    {dailyOrders.length > 0 ? (
                        <Carousel opts={{ loop: true }}>
                            <CarouselContent>
                                {dailyOrders.map(order => (
                                    <CarouselItem key={order.id} className="flex justify-center p-4">
                                        <div className="border-2 border-dashed p-1"><OrderReceiptLayout order={order} /></div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex" />
                            <CarouselNext className="hidden sm:flex" />
                        </Carousel>
                    ) : <p className="text-center text-muted-foreground">Nenhum pedido hoje.</p>}
                </CardContent>
            </Card>
        </div>

        {/* SEÇÃO 3: ESTATÍSTICAS DO MÊS */}
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Estatísticas do Mês</h2>
            <div className="grid gap-8 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Itens Mais Pedidos</CardTitle>
                        <CardDescription>Itens favoritos dos hóspedes este mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyMetrics && monthlyMetrics.topItemsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart layout="vertical" data={monthlyMetrics.topItemsData}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={120} stroke="#888888" fontSize={12} />
                                    <Tooltip wrapperClassName="!bg-background !border-border !rounded-lg" />
                                    <Bar dataKey="Quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground">Sem dados suficientes.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Cestas no Mês</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-bold">{monthlyMetrics?.totalBasketsMonth || 0}</div>
                        <p className="text-xs text-muted-foreground">desde o início do mês atual.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}