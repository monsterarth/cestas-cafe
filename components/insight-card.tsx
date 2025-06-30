// components/insight-card.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, AlertTriangle } from 'lucide-react';

interface InsightCardProps {
  type: 'strength' | 'opportunity';
  title: string;
  value?: number;
}

export const InsightCard = ({ type, title, value }: InsightCardProps) => {
    const isStrength = type === 'strength';
    const Icon = isStrength ? Lightbulb : AlertTriangle;
    const color = isStrength ? 'text-green-600' : 'text-amber-600';
    const bgColor = isStrength ? 'bg-green-50' : 'bg-amber-50';

    return (
        <Card className={`${bgColor} border-none`}>
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                <Icon className={`${color} h-6 w-6`} />
                <CardTitle className={`text-sm font-bold ${color}`}>
                    {isStrength ? 'Ponto Forte Principal' : 'Oportunidade de Melhoria'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-semibold">{title}</p>
                {value !== undefined && (
                    <p className="text-sm text-muted-foreground">Nota média: {value.toFixed(2)}</p>
                )}
            </CardContent>
        </Card>
    );
};