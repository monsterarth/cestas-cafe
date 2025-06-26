// app/api/surveys/[surveyId]/questions/[questionId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Question } from '@/types/survey';

// PUT: Atualiza uma pergunta existente
export async function PUT(request: Request, { params }: { params: { surveyId: string; questionId: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const updates: Partial<Question> = await request.json();
        const questionRef = adminDb.collection('surveys').doc(params.surveyId).collection('questions').doc(params.questionId);
        await questionRef.update(updates);
        return NextResponse.json({ message: 'Pergunta atualizada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao atualizar pergunta ${params.questionId}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// DELETE: Remove uma pergunta
export async function DELETE(request: Request, { params }: { params: { surveyId: string; questionId: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const questionRef = adminDb.collection('surveys').doc(params.surveyId).collection('questions').doc(params.questionId);
        await questionRef.delete();
        return NextResponse.json({ message: 'Pergunta deletada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao deletar pergunta ${params.questionId}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}