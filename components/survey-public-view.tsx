// components/survey-public-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Survey, Question, Answer } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StepSuccess } from '@/components/step-success';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Componente para a pergunta de avaliação com estrelas
const RatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => onChange(star)} type="button">
                    <Star
                        className={cn(
                            'h-10 w-10 transition-colors',
                            star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        )}
                    />
                </button>
            ))}
        </div>
    );
};

interface SurveyPublicViewProps {
    survey: Survey;
}

export function SurveyPublicView({ survey }: SurveyPublicViewProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const totalQuestions = survey.questions.length;

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        toast.loading("Enviando suas respostas...");

        const finalAnswers: Answer[] = survey.questions.map(q => ({
            id: '', 
            question_snapshot: q.text,
            question_category_snapshot: q.category,
            question_type_snapshot: q.type,
            value: answers[q.id] || ''
        }));
        
        try {
            const response = await fetch('/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: survey.id,
                    answers: finalAnswers
                }),
            });

            if (!response.ok) {
                throw new Error("Não foi possível enviar suas respostas. Tente novamente.");
            }
            
            toast.dismiss();
            setIsComplete(true);

        } catch (error: any) {
            toast.dismiss();
            toast.error("Erro ao enviar", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isComplete) {
        // CORREÇÃO FINAL: Usando as props corretas que acabamos de adicionar ao StepSuccess.
        return <StepSuccess 
            mainText="Obrigado por responder!" 
            subText="Sua opinião é muito importante para nós e nos ajuda a melhorar sua experiência." 
            gratitudeText="Equipe Fazenda do Rosa"
            footerText="Agradecemos a sua preferência!"
        />;
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8 px-4">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{survey.title}</CardTitle>
                    <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {survey.questions.map((question) => (
                                <CarouselItem key={question.id}>
                                    <div className="p-1 text-center space-y-4 min-h-[250px] flex flex-col justify-center">
                                        <h3 className="text-xl font-semibold">{question.text}</h3>
                                        {question.type === 'RATING' && (
                                            <RatingInput
                                                value={answers[question.id] || 0}
                                                onChange={(value) => handleAnswerChange(question.id, value)}
                                            />
                                        )}
                                        {question.type === 'TEXT' && (
                                            <Textarea
                                                value={answers[question.id] || ''}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                placeholder="Sua resposta..."
                                                rows={4}
                                            />
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex items-center justify-center space-x-4 mt-6">
                            <CarouselPrevious />
                            <div className="flex-grow flex flex-col items-center gap-2">
                                <Progress value={(current / totalQuestions) * 100} className="w-full max-w-xs" />
                                <span className="text-sm text-muted-foreground">Pergunta {current || 1} de {totalQuestions}</span>
                            </div>
                            {current < totalQuestions ? (
                                <CarouselNext />
                            ) : (
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Enviando..." : "Finalizar"}
                                </Button>
                            )}
                        </div>
                    </Carousel>
                </CardContent>
            </Card>
        </div>
    );
}

export default SurveyPublicView;