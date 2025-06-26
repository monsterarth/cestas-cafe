// components/question-editor-card.tsx
import React from 'react';
import { Question, QuestionType } from '@/types/survey';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// ATUALIZAÇÃO: Importar o tipo de listener do dnd-kit
import type { DraggableSyntheticListeners } from '@dnd-kit/core';


const QUESTION_CATEGORIES = ["Limpeza", "Atendimento", "Infraestrutura", "Comida", "Geral"];

interface QuestionEditorCardProps {
    question: Question;
    updateQuestion: (id: string, updates: Partial<Question>) => void;
    removeQuestion: (id: string) => void;
    // ATUALIZAÇÃO: Adicionar a prop para receber os listeners
    dragListeners?: DraggableSyntheticListeners;
}

export const QuestionEditorCard = ({ question, updateQuestion, removeQuestion, dragListeners }: QuestionEditorCardProps) => {

    const handleInputChange = (field: keyof Question, value: any) => {
        updateQuestion(question.id, { [field]: value });
    };

    return (
        <Card className="bg-white/80 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-slate-50 border-b">
                {/* ATUALIZAÇÃO: Os listeners são aplicados a este container, que agora é a alça de arrasto */}
                <div className="flex items-center gap-2 cursor-grab" {...dragListeners}>
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <h4 className="font-semibold">Pergunta</h4>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div>
                    <Label htmlFor={`question-text-${question.id}`}>Texto da Pergunta</Label>
                    <Input
                        id={`question-text-${question.id}`}
                        value={question.text}
                        onChange={(e) => handleInputChange('text', e.target.value)}
                        placeholder='Ex: Como você avalia a limpeza da cabana?'
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`question-type-${question.id}`}>Tipo</Label>
                        <Select
                            value={question.type}
                            onValueChange={(value: QuestionType) => handleInputChange('type', value)}
                        >
                            <SelectTrigger id={`question-type-${question.id}`}>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RATING">Avaliação (Estrelas)</SelectItem>
                                <SelectItem value="TEXT">Texto Aberto</SelectItem>
                                <SelectItem value="SINGLE_CHOICE">Múltipla Escolha (1 opção)</SelectItem>
                                <SelectItem value="MULTIPLE_CHOICE">Múltipla Escolha (Várias)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor={`question-category-${question.id}`}>Categoria</Label>
                        <Select
                            value={question.category}
                            onValueChange={(value: string) => handleInputChange('category', value)}
                        >
                            <SelectTrigger id={`question-category-${question.id}`}>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {QUESTION_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};