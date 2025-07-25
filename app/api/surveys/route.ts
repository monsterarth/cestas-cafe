// app/api/surveys/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Survey } from '@/types/survey';

// GET: Retorna uma lista de todas as pesquisas
export async function GET() {
<<<<<<< HEAD
    // TODO: Adicionar verificação de autenticação de admin
=======
>>>>>>> codigo-novo/main
    try {
        const surveysRef = adminDb.collection('surveys').orderBy('createdAt', 'desc');
        const snapshot = await surveysRef.get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }
<<<<<<< HEAD
        const surveys: Omit<Survey, 'questions'>[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            surveys.push({
=======

        // Mapeia os dados e converte o Timestamp para string
        const surveys = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
>>>>>>> codigo-novo/main
                id: doc.id,
                title: data.title,
                description: data.description,
                isActive: data.isActive,
<<<<<<< HEAD
                createdAt: data.createdAt,
            } as Omit<Survey, 'questions'>);
        });
=======
                // Converte o Timestamp do Firebase para uma string ISO, que é universal
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            };
        });
        
>>>>>>> codigo-novo/main
        return NextResponse.json(surveys);
    } catch (error: any) {
        console.error("Erro ao buscar pesquisas:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}

// POST: Cria uma nova pesquisa
export async function POST(request: Request) {
<<<<<<< HEAD
    // TODO: Adicionar verificação de autenticação de admin
    try {
        const { title, description } = await request.json();
=======
    try {
        const { title, description, isActive } = await request.json();
>>>>>>> codigo-novo/main
        if (!title) {
            return NextResponse.json({ message: 'O título é obrigatório.' }, { status: 400 });
        }
        const newSurvey = {
            title,
            description: description || '',
<<<<<<< HEAD
            isActive: false,
            createdAt: Timestamp.now(),
        };
        const docRef = await adminDb.collection('surveys').add(newSurvey);
        return NextResponse.json({ id: docRef.id, ...newSurvey }, { status: 201 });
=======
            isActive: isActive || false,
            createdAt: Timestamp.now(),
        };
        const docRef = await adminDb.collection('surveys').add(newSurvey);
        
        // Retorna o dado criado, já com a data convertida para string
        return NextResponse.json({ 
            id: docRef.id, 
            ...newSurvey,
            createdAt: newSurvey.createdAt.toDate().toISOString(),
        }, { status: 201 });

>>>>>>> codigo-novo/main
    } catch (error: any) {
        console.error("Erro ao criar pesquisa:", error);
        return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
    }
}