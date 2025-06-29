// components/survey-public-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
// ATUALIZAÇÃO: Importando o novo tipo de contexto
import { Survey, Question, Answer, SurveyResponseContext } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SurveySuccessCard } from './survey-success-card';

const RatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => ( <div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => onChange(star)} type="button"><Star className={cn('h-10 w-10 transition-colors', star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} /></button>))}</div> );
const NpsInput = ({ value, onChange }: { value: number | undefined; onChange: (value: number) => void }) => ( <div className="flex flex-wrap justify-center gap-2 px-2">{Array.from({ length: 11 }, (_, i) => i).map((num) => ( <Button key={num} variant={value === num ? 'default' : 'outline'} size="icon" onClick={() => onChange(num)} className="rounded-full h-10 w-10">{num}</Button> ))}</div> );

interface SurveyPublicViewProps {
    survey: Survey;
    config: AppConfig | null;
    // ATUALIZAÇÃO: Adicionando a prop 'context' para receber os dados da URL
    context: SurveyResponseContext;
}

export function SurveyPublicView({ survey, config, context }: SurveyPublicViewProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    
    const answerableQuestions = survey.questions.filter(q => q.type !== 'SECTION_BREAK');
    const totalQuestions = answerableQuestions.length;

    useEffect(() => {
        if (!api) return;
        const updateCurrent = () => {
            const currentQuestionIndex = api.selectedScrollSnap();
            const currentQuestion = survey.questions[currentQuestionIndex];
            if (currentQuestion?.type === 'SECTION_BREAK') {
                setTimeout(() => api.scrollNext(), 800);
            }
            const answeredCount = answerableQuestions.slice(0, api.selectedScrollSnap() + 1).filter(q => q.type !== 'SECTION_BREAK').length;
            setCurrent(answeredCount);
        };
        api.on("select", updateCurrent);
        // Pequeno timeout para garantir que a UI inicialize antes de checar a primeira pergunta
        setTimeout(updateCurrent, 100);
    }, [api, survey.questions, answerableQuestions]);

    const handleAnswerChange = (questionId: string, value: any, questionType: Question['type']) => {
        if (questionType === 'MULTIPLE_CHOICE') {
            const currentAnswers = (answers[questionId] || []) as string[];
            const newAnswers = currentAnswers.includes(value) ? currentAnswers.filter(item => item !== value) : [...currentAnswers, value];
            setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
        } else {
            setAnswers(prev => ({ ...prev, [questionId]: value }));
        }
        if (questionType !== 'TEXT' && questionType !== 'MULTIPLE_CHOICE') {
           setTimeout(() => api?.scrollNext(), 300);
        }
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true); toast.loading("Enviando suas respostas...");
        const finalAnswers: Omit<Answer, 'id'>[] = survey.questions
            .filter(q => q.type !== 'SECTION_BREAK')
            .map((q: Question) => ({
                question_snapshot: q.text,
                question_category_snapshot: q.category,
                question_type_snapshot: q.type,
                value: answers[q.id] || ''
            }));
        
        try {
            // ATUALIZAÇÃO: Incluindo o 'context' no corpo da requisição para a API
            const payload = { surveyId: survey.id, answers: finalAnswers, context };
            const response = await fetch('/api/responses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Não foi possível enviar suas respostas. Tente novamente.");
            }
            toast.dismiss(); setIsComplete(true);
        } catch (error: any) {
            toast.dismiss(); toast.error("Erro ao enviar", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isComplete) {
        return <SurveySuccessCard config={config} />;
    }

    return (
        <div className="w-full max-w-2xl overflow-x-hidden">
            <Card>
                <CardHeader className="text-center"><CardTitle className="text-2xl">{survey.title}</CardTitle><CardDescription>{survey.description}</CardDescription></CardHeader>
                <CardContent>
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {survey.questions.map((question: Question) => (
                                <CarouselItem key={question.id}>
                                    <div className="p-1 text-center space-y-6 min-h-[300px] flex flex-col justify-center items-center">
                                        {question.type === 'SECTION_BREAK' ? (
                                            <div className="space-y-2 text-center animate-in fade-in-50 duration-500">
                                                <Info className="h-10 w-10 mx-auto text-slate-400" />
                                                <h3 className="text-2xl font-bold">{question.text}</h3>
                                                {question.description && <p className="text-muted-foreground max-w-sm mx-auto">{question.description}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-semibold">{question.text}</h3>
                                                {question.type === 'RATING' && (<RatingInput value={answers[question.id] || 0} onChange={(value) => handleAnswerChange(question.id, value, 'RATING')} />)}
                                                {question.type === 'TEXT' && (<Textarea className="max-w-md" value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value, 'TEXT')} placeholder="Sua resposta..." rows={4} />)}
                                                {question.type === 'SINGLE_CHOICE' && (<RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value, 'SINGLE_CHOICE')} className="space-y-2 items-start text-left max-w-sm w-full">{(question.options || []).map((option: string) => (<div key={option} className="flex items-center space-x-2"><RadioGroupItem value={option} id={`${question.id}-${option}`} /><Label htmlFor={`${question.id}-${option}`}>{option}</Label></div>))}</RadioGroup>)}
                                                {question.type === 'MULTIPLE_CHOICE' && (<div className="space-y-2 items-start text-left max-w-sm w-full">{(question.options || []).map((option: string) => (<div key={option} className="flex items-center space-x-2"><Checkbox id={`${question.id}-${option}`} checked={(answers[question.id] || []).includes(option)} onCheckedChange={() => handleAnswerChange(question.id, option, 'MULTIPLE_CHOICE')} /><Label htmlFor={`${question.id}-${option}`}>{option}</Label></div>))}</div>)}
                                                {question.type === 'NPS' && (<NpsInput value={answers[question.id]} onChange={(value) => handleAnswerChange(question.id, value, 'NPS')} />)}
                                            </>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex items-center justify-center space-x-4 mt-6">
                            <CarouselPrevious /><div className="flex-grow flex flex-col items-center gap-2"><Progress value={(current / totalQuestions) * 100} className="w-full max-w-xs" /><span className="text-sm text-muted-foreground">Pergunta {current || 1} de {totalQuestions}</span></div>
                            {api?.selectedScrollSnap() !== survey.questions.length - 1 ? (<CarouselNext />) : (<Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Finalizar"}</Button>)}
                        </div>
                    </Carousel>
                </CardContent>
            </Card>
        </div>
    );
}

export default SurveyPublicView;