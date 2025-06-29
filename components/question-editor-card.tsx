// components/question-editor-card.tsx
import React from 'react';
import { Question, QuestionType } from '@/types/survey';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, PlusCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';

const QUESTION_CATEGORIES = ["Limpeza", "Atendimento", "Infraestrutura", "Comida", "Geral"];

interface QuestionEditorCardProps {
    question: Question;
    updateQuestion: (id: string, updates: Partial<Question>) => void;
    removeQuestion: (id: string) => void;
    dragListeners?: DraggableSyntheticListeners;
}

export const QuestionEditorCard = ({ question, updateQuestion, removeQuestion, dragListeners }: QuestionEditorCardProps) => {
    const handleInputChange = (field: keyof Question, value: any) => {
        updateQuestion(question.id, { [field]: value });
    };

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...(question.options || [])];
        newOptions[index] = text;
        updateQuestion(question.id, { options: newOptions });
    };

    const addOption = () => {
        const newOptions = [...(question.options || []), "Nova Opção"];
        updateQuestion(question.id, { options: newOptions });
    };

    const removeOption = (index: number) => {
        const newOptions = (question.options || []).filter((_, i) => i !== index);
        updateQuestion(question.id, { options: newOptions });
    };
    
    const showOptionsEditor = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';
    const isSectionBreak = question.type === 'SECTION_BREAK';
    const isNPS = question.type === 'NPS';

    return (
        <Card className="bg-white/80 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-slate-50 border-b">
                <div className="flex items-center gap-2 cursor-grab" {...dragListeners}><GripVertical className="h-5 w-5 text-gray-400" /><h4 className="font-semibold">{isSectionBreak ? 'Divisor de Seção' : `Pergunta ${isNPS ? '(NPS)' : ''}`}</h4></div>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div><Label htmlFor={`question-text-${question.id}`}>{isSectionBreak ? 'Título da Seção' : 'Texto da Pergunta'}</Label><Input id={`question-text-${question.id}`} value={question.text} onChange={(e) => handleInputChange('text', e.target.value)} placeholder={isSectionBreak ? 'Ex: Sobre sua Cabana' : 'Ex: Como você avalia a limpeza?'} /></div>

                {isSectionBreak && (
                    <div><Label htmlFor={`question-description-${question.id}`}>Texto de Apoio (Opcional)</Label><Textarea id={`question-description-${question.id}`} value={question.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Uma breve descrição para esta seção." rows={2} /></div>
                )}
                
                {!isSectionBreak && (
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label htmlFor={`question-type-${question.id}`}>Tipo</Label><Select value={question.type} onValueChange={(value: QuestionType) => handleInputChange('type', value)}><SelectTrigger id={`question-type-${question.id}`}><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="RATING">Avaliação (Estrelas)</SelectItem><SelectItem value="TEXT">Texto Aberto</SelectItem><SelectItem value="SINGLE_CHOICE">Escolha Única</SelectItem><SelectItem value="MULTIPLE_CHOICE">Múltipla Escolha</SelectItem><SelectItem value="NPS">Escala Numérica (NPS)</SelectItem><SelectItem value="SECTION_BREAK">Divisor de Seção</SelectItem></SelectContent></Select></div>
                        {!isNPS && (
                             <div><Label htmlFor={`question-category-${question.id}`}>Categoria</Label><Select value={question.category} onValueChange={(value: string) => handleInputChange('category', value)}><SelectTrigger id={`question-category-${question.id}`}><SelectValue placeholder="Selecione a categoria" /></SelectTrigger><SelectContent>{QUESTION_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                        )}
                    </div>
                )}
                
                {showOptionsEditor && (
                    <div className="space-y-3 pt-3 border-t"><Label>Opções de Resposta</Label>{(question.options || []).map((option, index) => (<div key={index} className="flex items-center gap-2"><Input value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Opção ${index + 1}`} /><Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}><X className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" size="sm" onClick={addOption}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Opção</Button></div>
                )}
            </CardContent>
        </Card>
    );
};