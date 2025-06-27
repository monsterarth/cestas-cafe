// app/api/surveys/[surveyId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Survey } from '@/types/survey';
import { Timestamp } from 'firebase-admin/firestore';

// GET: Retorna uma única pesquisa com suas perguntas
export async function GET(request: Request, { params }: { params: { surveyId: string } }) {
    try {
        const surveyRef = adminDb.collection('surveys').doc(params.surveyId); // USA surveyId
        const surveyDoc = await surveyRef.get();
        if (!surveyDoc.exists) {
            return NextResponse.json({ message: 'Pesquisa não encontrada.' }, { status: 404 });
        }
        const questionsRef = surveyRef.collection('questions').orderBy('position', 'asc');
        const questionsSnapshot = await questionsRef.get();
        const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const rawData = surveyDoc.data();
        const surveyData = { 
            id: surveyDoc.id, 
            ...rawData, 
            createdAt: (rawData?.createdAt as Timestamp).toDate().toISOString(),
            questions 
        };
        return NextResponse.json(surveyData);
    } catch (error: any) {
        console.error(`Erro ao buscar pesquisa ${params.surveyId}:`, error); // USA surveyId
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// PUT: Atualiza os dados de uma pesquisa
export async function PUT(request: Request, { params }: { params: { surveyId: string } }) {
    try {
        const updates = await request.json();
        const surveyRef = adminDb.collection('surveys').doc(params.surveyId); // USA surveyId
        await surveyRef.update(updates);
        return NextResponse.json({ message: 'Pesquisa atualizada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao atualizar pesquisa ${params.surveyId}:`, error); // USA surveyId
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// DELETE: Deleta uma pesquisa e suas subcoleções
export async function DELETE(request: Request, { params }: { params: { surveyId: string } }) {
    try {
        const surveyRef = adminDb.collection('surveys').doc(params.surveyId); // USA surveyId
        // TODO: Implementar deleção em cascata das subcoleções de forma mais robusta
        await surveyRef.delete();
        return NextResponse.json({ message: 'Pesquisa deletada com sucesso.' });
    } catch (error: any) {
        console.error(`Erro ao deletar pesquisa ${params.surveyId}:`, error); // USA surveyId
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}