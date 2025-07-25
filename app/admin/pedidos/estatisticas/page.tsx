'use client'

import { useFetchData } from '@/hooks/use-fetch-data';
import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LoadingScreen } from '@/components/loading-screen';

// --- Tipagens para os dados das estatísticas ---
interface PedidosStats {
  totalPedidos: number;
  totalItens: number;
  horariosPico: { time: string; count: number }[];
  categoriasMaisConsumidas: { name: string; value: number }[];
  itensMaisPedidos: { name: string; value: number }[];
}

// --- Lógica de processamento dos dados ---
const processarEstatisticas = (orders: Order[]): PedidosStats => {
  const totalPedidos = orders.length;
  let totalItens = 0;
  const horariosPicoMap: Record<string, number> = {};
  const categoriasMap: Record<string, number> = {};
  const itensMap: Record<string, number> = {};

  orders.forEach(order => {
    // Horários de pico
    const hora = order.horarioEntrega;
    horariosPicoMap[hora] = (horariosPicoMap[hora] || 0) + 1;

    // Itens e Categorias
    order.itensPedido.forEach((item: ItemPedido) => {
      totalItens += item.quantidade;
      
      // Contagem de itens
      const nomeItem = item.sabor ? `${item.nomeItem} (${item.sabor})` : item.nomeItem;
      itensMap[nomeItem] = (itensMap[nomeItem] || 0) + item.quantidade;

      // Contagem de categorias
      if (item.categoria) {
        categoriasMap[item.categoria] = (categoriasMap[item.categoria] || 0) + item.quantidade;
      }
    });
  });

  // Formatação para o gráfico
  const horariosPico = Object.entries(horariosPicoMap)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));
    
  const categoriasMaisConsumidas = Object.entries(categoriasMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const itensMaisPedidos = Object.entries(itensMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return { totalPedidos, totalItens, horariosPico, categoriasMaisConsumidas, itensMaisPedidos };
};


// Tipagem para as props do label do gráfico
interface PieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    index?: number;
}
  
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
    // CORREÇÃO: Adicionamos verificações para garantir que os valores não sejam undefined
    if (cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) {
        return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
};


export default function EstatisticasPage() {
  const { data: orders, isLoading, error } = useFetchData<Order[]>('/api/pedidos/all');

  const stats = useMemo(() => {
    if (!orders) return null;
    return processarEstatisticas(orders);
  }, [orders]);

  if (isLoading) return <LoadingScreen message="Processando estatísticas..." />;
  if (error || !stats) return <div>Erro ao carregar estatísticas. Tente novamente mais tarde.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold">{stats.totalPedidos}</p>
            <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold">{stats.totalItens}</p>
            <p className="text-sm text-muted-foreground">Total de Itens Servidos</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Categorias Mais Consumidas</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Tooltip />
                        <Pie
                            data={stats.categoriasMaisConsumidas}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {stats.categoriasMaisConsumidas.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários de Pico de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.horariosPico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Nº de Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Top 10 Itens Mais Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart layout="vertical" data={stats.itensMaisPedidos} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
      </Card>
    </div>
  );
}