import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!startDateParam || !endDateParam) {
            return NextResponse.json({ message: 'Período de datas é obrigatório.' }, { status: 400 });
        }

        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);

        const db = adminDb;
        const ordersRef = db.collection('purchaseOrders');
        const q = ordersRef
            .where('createdAt', '>=', Timestamp.fromDate(startDate))
            .where('createdAt', '<=', Timestamp.fromDate(endDate));

        const snapshot = await q.get();

        if (snapshot.empty) {
            return NextResponse.json({
                totalPedidosCompra: 0,
                totalItensComprados: 0,
                itensMaisComprados: [],
                fornecedoresMaisAcionados: [],
            });
        }
        
        const orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as PurchaseOrder);

        const totalPedidosCompra = orders.length;

        const itemCounts: { [key: string]: number } = {};
        const supplierCounts: { [key: string]: number } = {};
        let totalItensComprados = 0;

        orders.forEach((order: PurchaseOrder) => {
            supplierCounts[order.supplierName] = (supplierCounts[order.supplierName] || 0) + 1;
            
            order.items.forEach((item: PurchaseOrderItem) => {
                itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + item.quantity;
                totalItensComprados += item.quantity;
            });
        });

        const itensMaisComprados = Object.entries(itemCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const fornecedoresMaisAcionados = Object.entries(supplierCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        
        return NextResponse.json({
            totalPedidosCompra,
            totalItensComprados,
            itensMaisComprados,
            fornecedoresMaisAcionados,
        });

    } catch (error: any) {
        console.error("Erro na API de estatísticas de compra:", error);
        return NextResponse.json({ message: "Erro interno do servidor", error: error.message }, { status: 500 });
    }
}