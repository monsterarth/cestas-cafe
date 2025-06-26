// app/api/surveys/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Survey } from '@/types/survey';

// GET: Retorna uma lista de todas as pesquisas
export async function GET() {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const surveysRef = adminDb.collection('surveys').orderBy('createdAt', 'desc');
        const snapshot = await surveysRef.get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }
        const surveys: Omit<Survey, 'questions'>[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            surveys.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                isActive: data.isActive,
                createdAt: data.createdAt,
            } as Omit<Survey, 'questions'>);
        });
        return NextResponse.json(surveys);
    } catch (error: any) {
        console.error("Erro ao buscar pesquisas:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// POST: Cria uma nova pesquisa
export async function POST(request: Request) {
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const { title, description } = await request.json();
        if (!title) {
            return NextResponse.json({ message: 'O título é obrigatório.' }, { status: 400 });
        }
        const newSurvey = {
            title,
            description: description || '',
            isActive: false,
            createdAt: Timestamp.now(),
        };
        const docRef = await adminDb.collection('surveys').add(newSurvey);
        return NextResponse.json({ id: docRef.id, ...newSurvey }, { status: 201 });
    } catch (error: any) {
        console.error("Erro ao criar pesquisa:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}