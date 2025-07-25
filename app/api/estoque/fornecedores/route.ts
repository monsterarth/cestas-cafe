// cestas-cafe/app/api/estoque/fornecedores/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Supplier } from '@/types';

// GET (Listar todos ou um específico)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const docSnap = await adminDb.collection('fornecedores').doc(id).get();
            if (!docSnap.exists) {
                return NextResponse.json({ message: 'Fornecedor não encontrado' }, { status: 404 });
            }
            return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
        } else {
            const snapshot = await adminDb.collection('fornecedores').get();
            const suppliers: Supplier[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
            return NextResponse.json(suppliers);
        }
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST (Criar novo)
export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 });

        const docRef = await adminDb.collection('fornecedores').add({ name });
        return NextResponse.json({ id: docRef.id, name }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE (Excluir)
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'ID do fornecedor é obrigatório' }, { status: 400 });

    try {
        // Excluir o fornecedor
        await adminDb.collection('fornecedores').doc(id).delete();
        
        // Excluir itens associados
        const itemsQuery = adminDb.collection('itens_estoque').where('supplierId', '==', id);
        const itemsSnap = await itemsQuery.get();
        const batch = adminDb.batch();
        itemsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({ message: 'Fornecedor e itens excluídos' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}