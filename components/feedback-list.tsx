// components/feedback-list.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';

interface FeedbackListProps {
    feedbacks: string[];
}

export const FeedbackList = ({ feedbacks }: FeedbackListProps) => {
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Comentários Recebidos</CardTitle>
                <CardDescription>Respostas abertas dos hóspedes.</CardDescription>
            </CardHeader>
            <CardContent>
                {feedbacks && feedbacks.length > 0 ? (
                    <ScrollArea className="h-72">
                        <div className="space-y-4">
                            {feedbacks.map((feedback, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <MessageSquare className="h-5 w-5 mt-1 text-slate-500 flex-shrink-0" />
                                    <p className="text-sm text-slate-800">{feedback}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
                        Nenhum comentário de texto neste período.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};