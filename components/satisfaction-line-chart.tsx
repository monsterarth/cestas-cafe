// components/satisfaction-line-chart.tsx
'use client';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
    date: string;
    averageRating: number;
}

const chartConfig = {
    averageRating: { label: "Nota Média", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export const SatisfactionLineChart = ({ data }: { data: ChartData[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Satisfação ao Longo do Tempo</CardTitle>
                <CardDescription>Média das notas de avaliação (1-5) por dia de resposta.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-72 w-full">
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8}
                                tickFormatter={(value) => format(parseISO(value), "dd/MM")}
                            />
                            <YAxis domain={[1, 5]} tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                dataKey="averageRating"
                                type="monotone"
                                stroke="var(--color-averageRating)"
                                strokeWidth={2}
                                dot={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}