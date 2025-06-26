// app/api/surveys/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Survey } from '@/types/survey';

// GET: Retorna uma única pesquisa com suas perguntas
export async function GET(request: Request, { params }: { params: { id: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const surveyRef = adminDb.collection('surveys').doc(params.id);
        const surveyDoc = await surveyRef.get();
        if (!surveyDoc.exists) {
            return NextResponse.json({ message: 'Pesquisa não encontrada.' }, { status: 404 });
        }
        const questionsRef = surveyRef.collection('questions').orderBy('position', 'asc');
        const questionsSnapshot = await questionsRef.get();
        const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const surveyData = { id: surveyDoc.id, ...surveyDoc.data(), questions } as Survey;
        return NextResponse.json(surveyData);
    } catch (error: any) {
        console.error(`Erro ao buscar pesquisa ${params.id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// PUT: Atualiza os dados de uma pesquisa
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const updates = await request.json();
        const surveyRef = adminDb.collection('surveys').doc(params.id);
        await surveyRef.update(updates);
        return NextResponse.json({ message: 'Pesquisa atualizada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao atualizar pesquisa ${params.id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// DELETE: Deleta uma pesquisa e suas subcoleções
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const surveyRef = adminDb.collection('surveys').doc(params.id);
        // Deletar subcoleções (questions, etc.) seria necessário aqui em um cenário real
        await surveyRef.delete();
        return NextResponse.json({ message: 'Pesquisa deletada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao deletar pesquisa ${params.id}:`, error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}