// components/survey-builder-form.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Question } from '@/types/survey';
import { QuestionEditorCard } from './question-editor-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PlusCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

// Componente wrapper para tornar o QuestionEditorCard arrastável
function SortableQuestionCard({ id, question, updateQuestion, removeQuestion }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <QuestionEditorCard question={question} updateQuestion={updateQuestion} removeQuestion={removeQuestion} />
        </div>
    );
}

export function SurveyBuilderForm() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const addNewQuestion = () => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`, // ID temporário
            text: '',
            type: 'RATING',
            category: 'Geral',
            position: questions.length,
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            const newQuestions = [...questions];
            const [movedQuestion] = newQuestions.splice(oldIndex, 1);
            newQuestions.splice(newIndex, 0, movedQuestion);
            setQuestions(newQuestions.map((q, index) => ({ ...q, position: index })));
        }
    };

    const handleSave = async () => {
        if (!title) {
            toast.error('O título da pesquisa é obrigatório.');
            return;
        }
        setIsSaving(true);
        toast.loading('Salvando pesquisa...');
        
        try {
            // 1. Criar o documento da pesquisa
            const surveyResponse = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });

            if (!surveyResponse.ok) throw new Error('Falha ao criar a pesquisa.');

            const surveyData = await surveyResponse.json();
            const surveyId = surveyData.id;

            // 2. Salvar cada pergunta na subcoleção
            for (const question of questions) {
                const { id, ...questionData } = question; // Remove o ID temporário
                await fetch(`/api/surveys/${surveyId}/questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(questionData),
                });
            }

            toast.dismiss();
            toast.success('Pesquisa salva com sucesso!');
            router.push('/admin/surveys');

        } catch (error: any) {
            toast.dismiss();
            toast.error('Erro ao salvar a pesquisa.', { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="p-6 border rounded-lg bg-white space-y-4">
                <div>
                    <Label htmlFor="survey-title" className="text-lg">Título da Pesquisa</Label>
                    <Input id="survey-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pesquisa de Satisfação - Junho/2025" />
                </div>
                <div>
                    <Label htmlFor="survey-description">Descrição</Label>
                    <Textarea id="survey-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Uma breve descrição sobre o objetivo desta pesquisa." />
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <SortableQuestionCard key={q.id} id={q.id} question={q} updateQuestion={updateQuestion} removeQuestion={removeQuestion} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={addNewQuestion}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Pergunta
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Pesquisa'}
                </Button>
            </div>
        </div>
    );
}