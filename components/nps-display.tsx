// components/nps-display.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface NpsDisplayProps {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

export const NpsDisplay = ({ score, promoters, passives, detractors, total }: NpsDisplayProps) => {
    const getScoreColor = () => {
        if (score > 50) return 'text-green-600';
        if (score > 0) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    const calcPercentage = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Net Promoter Score (NPS)</CardTitle>
                <CardDescription>Mede a lealdade dos seus hóspedes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <p className={`text-6xl font-bold ${getScoreColor()}`}>{score}</p>
                    <p className="text-sm text-muted-foreground">de -100 a 100</p>
                </div>
                <div className="flex justify-around text-center text-xs">
                    <div>
                        <p className="font-bold text-lg text-green-500">{calcPercentage(promoters)}%</p>
                        <p className="text-muted-foreground">Promotores</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg text-yellow-500">{calcPercentage(passives)}%</p>
                        <p className="text-muted-foreground">Passivos</p>
                    </div>
                     <div>
                        <p className="font-bold text-lg text-red-500">{calcPercentage(detractors)}%</p>
                        <p className="text-muted-foreground">Detratores</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};