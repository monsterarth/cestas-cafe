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
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
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
import { Switch } from './ui/switch';

function SortableQuestionCard({ id, question, updateQuestion, removeQuestion }: { id: string, question: Question, updateQuestion: (id: string, updates: Partial<Question>) => void, removeQuestion: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <QuestionEditorCard question={question} updateQuestion={updateQuestion} removeQuestion={removeQuestion} dragListeners={listeners} />
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
    const [isActive, setIsActive] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleKeyboardSensor = (event: React.KeyboardEvent) => {
        const interactiveElements = ['input', 'textarea', 'button', 'select'];
        if (event.code === 'Space' && event.target instanceof HTMLElement && interactiveElements.includes(event.target.tagName.toLowerCase())) {
            return false;
        }
        return true;
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { event: 'keydown', shouldHandleEvent: handleKeyboardSensor, coordinateGetter: sortableKeyboardCoordinates })
    );

    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setIsActive(initialData.isActive);
            const sortedQuestions = initialData.questions.sort((a, b) => a.position - b.position);
            setQuestions(sortedQuestions.map(q => ({ ...q, id: q.id || `q_${Math.random()}` })));
        }
    }, [initialData]);
    
    const addNewQuestion = () => {
        const newQuestion: Question = { id: `q_${Date.now()}`, text: '', type: 'RATING', category: 'Geral', position: questions.length };
        setQuestions(prev => [...prev, newQuestion]);
    };
    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...updates } : q)));
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

    // CORREÇÃO: Lógica de salvamento refeita para ser sequencial e mais robusta.
    const handleSave = async () => {
        if (!title) { toast.error('O título da pesquisa é obrigatório.'); return; }
        setIsSaving(true);
        toast.loading('Salvando alterações...');

        try {
            const surveyPayload = { title, description, isActive };
            let surveyId = initialData?.id;

            if (isEditMode && surveyId) {
                // MODO EDIÇÃO
                // 1. Atualiza os dados principais da pesquisa
                const surveyUpdateResponse = await fetch(`/api/surveys/${surveyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(surveyPayload),
                });
                if (!surveyUpdateResponse.ok) throw new Error("Falha ao atualizar os detalhes da pesquisa.");

                // 2. Deleta as perguntas antigas, uma por uma, verificando cada resposta
                for (const oldQuestion of initialData.questions) {
                    const deleteResponse = await fetch(`/api/surveys/${surveyId}/questions/${oldQuestion.id}`, { method: 'DELETE' });
                    if (!deleteResponse.ok) {
                        // Se uma falhar, o processo para e exibe uma mensagem clara.
                        throw new Error(`Falha ao limpar a pergunta antiga: "${oldQuestion.text}"`);
                    }
                }
            } else {
                // MODO CRIAÇÃO
                const surveyResponse = await fetch('/api/surveys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(surveyPayload),
                });
                if (!surveyResponse.ok) throw new Error('Falha ao criar a pesquisa.');
                const newSurveyData = await surveyResponse.json();
                surveyId = newSurveyData.id;
            }

            if (!surveyId) {
                throw new Error("ID da pesquisa não encontrado para salvar as perguntas.");
            }

            // 3. Cria as novas perguntas (ou as perguntas atualizadas), uma por uma
            for (const question of questions) {
                const { id, ...questionData } = question; // Remove o ID temporário do cliente
                const createResponse = await fetch(`/api/surveys/${surveyId}/questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(questionData),
                });
                if (!createResponse.ok) {
                    throw new Error(`Falha ao salvar a pergunta: "${question.text}"`);
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
            <div className="p-6 border rounded-lg bg-white space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                    <div>
                        <Label htmlFor="survey-status" className="font-semibold">Status da Pesquisa</Label>
                        <p className="text-sm text-muted-foreground">{isActive ? "Esta pesquisa está ativa e pode receber respostas." : "Esta pesquisa está inativa."}</p>
                    </div>
                    <Switch id="survey-status" checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <div>
                    <Label htmlFor="survey-title" className="text-lg">Título da Pesquisa</Label>
                    <Input id="survey-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pesquisa de Satisfação - Julho/2025" />
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
                <Button variant="outline" onClick={addNewQuestion}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Pergunta</Button>
                <Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </div>
        </div>
    );
}