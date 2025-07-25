// cestas-cafe/app/api/estoque/itens/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { StockItem } from '@/types';

// GET (Listar itens de um fornecedor)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
        return NextResponse.json({ message: 'ID do fornecedor é obrigatório' }, { status: 400 });
    }

    try {
        const snapshot = await adminDb.collection('itens_estoque').where('supplierId', '==', supplierId).get();
        const items: StockItem[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST (Criar novo item)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, supplierId, posicao } = body;

        if (!name || !supplierId) {
            return NextResponse.json({ message: 'Nome e ID do fornecedor são obrigatórios' }, { status: 400 });
        }
        
        const newItem = { name, supplierId, posicao: posicao || 0 };
        const docRef = await adminDb.collection('itens_estoque').add(newItem);
        
        return NextResponse.json({ id: docRef.id, ...newItem }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE (Excluir item)
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ message: 'ID do item é obrigatório' }, { status: 400 });
    }
    
    try {
        await adminDb.collection('itens_estoque').doc(id).delete();
        return NextResponse.json({ message: 'Item excluído com sucesso' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}