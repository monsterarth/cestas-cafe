// components/survey-public-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
import { Survey, Question, Answer, SurveyResponseContext } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// ATUALIZAÇÃO: Importando os ícones necessários
import { Star, Info, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SurveySuccessCard } from './survey-success-card';

const RatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => ( <div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => onChange(star)} type="button"><Star className={cn('h-10 w-10 transition-colors', star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} /></button>))}</div> );
const NpsInput = ({ value, onChange }: { value: number | undefined; onChange: (value: number) => void }) => ( <div className="flex flex-wrap justify-center gap-2 px-2">{Array.from({ length: 11 }, (_, i) => i).map((num) => ( <Button key={num} variant={value === num ? 'default' : 'outline'} size="icon" onClick={() => onChange(num)} className="rounded-full h-10 w-10">{num}</Button> ))}</div> );

interface SurveyPublicViewProps {
    survey: Survey;
    config: AppConfig | null;
    context: SurveyResponseContext;
}

export function SurveyPublicView({ survey, config, context }: SurveyPublicViewProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    
    const answerableQuestions = survey.questions.filter(q => q.type !== 'SECTION_BREAK');
    const totalAnswerableQuestions = answerableQuestions.length;

    useEffect(() => {
        if (!api) return;
        const updateCurrent = () => {
            if (api) {
                const currentQuestionIndex = api.selectedScrollSnap();
                const currentQuestion = survey.questions[currentQuestionIndex];
                if (currentQuestion?.type === 'SECTION_BREAK') {
                    // Pula automaticamente para o próximo se for um divisor
                    setTimeout(() => api.scrollNext(), 800);
                }
                setCurrentSlide(currentQuestionIndex);
            }
        };
        api.on("select", updateCurrent);
        setTimeout(updateCurrent, 100);
        return () => { api.off("select", updateCurrent); };
    }, [api, survey.questions]);

    const handleAnswerChange = (questionId: string, value: any, questionType: Question['type']) => {
        if (questionType === 'MULTIPLE_CHOICE') {
            const currentAnswers = (answers[questionId] || []) as string[];
            const newAnswers = currentAnswers.includes(value) ? currentAnswers.filter(item => item !== value) : [...currentAnswers, value];
            setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
        } else {
            setAnswers(prev => ({ ...prev, [questionId]: value }));
        }
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true); toast.loading("Enviando suas respostas...");
        const finalAnswers: Omit<Answer, 'id'>[] = answerableQuestions.map((q: Question) => ({
            question_snapshot: q.text, question_category_snapshot: q.category,
            question_type_snapshot: q.type, value: answers[q.id] || ''
        }));
        
        try {
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
    
    const progressPercentage = totalAnswerableQuestions > 0 ? ((currentSlide + 1) / survey.questions.length) * 100 : 0;
    
    return (
        <div className="w-full max-w-2xl overflow-x-hidden">
            <Card>
                <CardHeader className="text-center"><CardTitle className="text-2xl">{survey.title}</CardTitle><CardDescription>{survey.description}</CardDescription></CardHeader>
                <CardContent>
                    <Carousel setApi={setApi} opts={{ align: "start", loop: false }}>
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
                        
                        <div className="mt-8 space-y-4">
                           <Progress value={progressPercentage} className="w-full max-w-xs mx-auto" />
                           <div className="flex items-center justify-center space-x-4">
                               <Button variant="outline" size="icon" onClick={() => api?.scrollPrev()} disabled={!api?.canScrollPrev()}>
                                   <ArrowLeft className="h-4 w-4" />
                                   <span className="sr-only">Anterior</span>
                               </Button>

                               <span className="text-sm font-medium text-muted-foreground">
                                   {currentSlide + 1} de {survey.questions.length}
                               </span>
                               
                               {/* CORREÇÃO: Lógica para o botão de próximo / finalizar */}
                               {api?.selectedScrollSnap() !== survey.questions.length - 1 ? (
                                    <Button variant="outline" size="icon" onClick={() => api?.scrollNext()} disabled={!api?.canScrollNext()}>
                                        <ArrowRight className="h-4 w-4" />
                                        <span className="sr-only">Próximo</span>
                                    </Button>
                               ) : (
                                    <Button onClick={handleSubmit} disabled={isSubmitting} size="icon" className="bg-green-600 hover:bg-green-700 text-white">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        <span className="sr-only">Finalizar</span>
                                    </Button>
                               )}
                           </div>
                        </div>
                    </Carousel>
                </CardContent>
            </Card>
        </div>
    );
}