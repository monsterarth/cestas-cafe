// components/survey-builder-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Question, Survey } from '@/types/survey';
import { QuestionEditorCard } from './question-editor-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PlusCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

function SortableQuestionCard({ id, question, updateQuestion, removeQuestion }: { id: string, question: Question, updateQuestion: (id: string, updates: Partial<Question>) => void, removeQuestion: (id: string) => void }) {
    // ATUALIZAÇÃO: separamos os `listeners` dos outros atributos
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        // ATUALIZAÇÃO: O container principal agora só tem os atributos de acessibilidade (`attributes`)
        // Os `listeners` de arrasto são passados como prop para o componente filho.
        <div ref={setNodeRef} style={style} {...attributes}>
            <QuestionEditorCard
                question={question}
                updateQuestion={updateQuestion}
                removeQuestion={removeQuestion}
                dragListeners={listeners}
            />
        </div>
    );
}

interface SurveyBuilderFormProps {
    initialData?: Survey;
}

export function SurveyBuilderForm({ initialData }: SurveyBuilderFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            // Ordenar as perguntas pela posição ao carregar
            const sortedQuestions = initialData.questions.sort((a, b) => a.position - b.position);
            setQuestions(sortedQuestions.map(q => ({ ...q, id: q.id || `q_${Math.random()}` })));
        }
    }, [initialData]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const addNewQuestion = () => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const reorderedItems = arrayMove(items, oldIndex, newIndex);
                return reorderedItems.map((item, index) => ({ ...item, position: index }));
            });
        }
    };
    
    const handleSave = async () => {
        if (!title) {
            toast.error('O título da pesquisa é obrigatório.');
            return;
        }
        setIsSaving(true);
        toast.loading('Salvando alterações...');

        try {
            if (isEditMode) {
                const surveyId = initialData.id;
                await fetch(`/api/surveys/${surveyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                });
                for (const oldQuestion of initialData.questions) {
                    await fetch(`/api/surveys/${surveyId}/questions/${oldQuestion.id}`, { method: 'DELETE' });
                }
                for (const question of questions) {
                    const { id, ...questionData } = question;
                    await fetch(`/api/surveys/${surveyId}/questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(questionData),
                    });
                }
            } else {
                const surveyResponse = await fetch('/api/surveys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                });
                if (!surveyResponse.ok) throw new Error('Falha ao criar a pesquisa.');
                const surveyData = await surveyResponse.json();
                const surveyId = surveyData.id;
                for (const question of questions) {
                    const { id, ...questionData } = question;
                    await fetch(`/api/surveys/${surveyId}/questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(questionData),
                    });
                }
            }
            toast.dismiss();
            toast.success('Pesquisa salva com sucesso!');
            router.push('/admin/surveys');
            router.refresh();
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
                    {isSaving ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Pesquisa')}
                </Button>
            </div>
        </div>
    );
}