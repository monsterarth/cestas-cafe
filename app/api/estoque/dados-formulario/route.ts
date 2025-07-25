// cestas-cafe/app/api/estoque/dados-formulario/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Supplier, StockItem } from '@/types';

export async function GET() {
    try {
        const suppliersPromise = adminDb.collection('fornecedores').get();
        const itemsPromise = adminDb.collection('itens_estoque').get();

        const [suppliersSnap, itemsSnap] = await Promise.all([suppliersPromise, itemsPromise]);

        const suppliers: Supplier[] = suppliersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
        const items: StockItem[] = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));

        return NextResponse.json({ suppliers, items });

    } catch (error) {
        console.error("Erro ao buscar dados do formulário de estoque:", error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}