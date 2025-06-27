// components/category-bar-chart.tsx
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Tipos para os dados e props do componente
interface ChartData {
    name: string;
    value: number;
}

interface CategoryBarChartProps {
    data: ChartData[];
}

// Configuração do gráfico
const chartConfig = {
    value: {
        label: "Nota Média",
    },
};

export const CategoryBarChart = ({ data }: CategoryBarChartProps) => {
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Nota Média por Categoria</CardTitle>
                <CardDescription>Média das notas de 1 a 5 para cada área avaliada.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-72 w-full">
                    <BarChart
                        data={data}
                        accessibilityLayer
                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 5]}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.toString()}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar
                            dataKey="value"
                            fill="hsl(var(--chart-1))"
                            radius={8}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

// Adicionar um export default para boa prática
export default CategoryBarChart;