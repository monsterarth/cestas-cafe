// Arquivo: app/admin/pedidos/estatisticas/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface StatsData {
    totalPedidos: number;
    pratosPopulares: { name: string; value: number }[];
    horariosPopulares: { name: string; value: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                if (!response.ok) throw new Error("Falha ao buscar estatísticas.");
                const data = await response.json();
                setStats(data);
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!stats) {
        return <p>Não foi possível carregar os dados.</p>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Estatísticas e KPIs de Marketing</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Total de Pedidos Registrados</CardTitle>
                    <CardDescription>O número total de cestas solicitadas desde o início.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold">{stats.totalPedidos}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pratos Quentes Mais Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={stats.pratosPopulares} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {stats.pratosPopulares.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value} pedidos`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Horários de Entrega Preferidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.horariosPopulares}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Nº de Pedidos" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}