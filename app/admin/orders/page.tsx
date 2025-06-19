'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { OrderPrintLayout } from '@/components/order-print-layout';
import { OrderReceiptLayout } from '@/components/order-receipt-layout';
import { OrdersSummaryLayout } from '@/components/orders-summary-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
// ... outros imports

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [componentToPrint, setComponentToPrint] = useState<React.ReactElement | null>(null);

  const fetchAndSetOrders = useCallback(() => { /* ... código da função sem alterações ... */ }, []);
  useEffect(() => { const cleanup = fetchAndSetOrders(); return cleanup; }, [fetchAndSetOrders]);
  
  useEffect(() => {
    const handleAfterPrint = () => setComponentToPrint(null);
    window.addEventListener('afterprint', handleAfterPrint);
    if (componentToPrint) {
      const timer = setTimeout(() => window.print(), 100);
      return () => clearTimeout(timer);
    }
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [componentToPrint]);

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    if (type === 'a4') setComponentToPrint(<OrderPrintLayout order={order} />);
    else setComponentToPrint(<OrderReceiptLayout order={order} />);
  };
  
  // ===================================================================
  // CORREÇÃO FINAL: Lógica de agregação de dados
  // ===================================================================
  const triggerSummaryPrint = () => {
    const pendingOrders = orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado");
    if (pendingOrders.length === 0) {
      toast.info("Nenhum pedido pendente para gerar resumo.");
      return;
    }

    const summary = pendingOrders
      .flatMap(order => order.itensPedido || [])
      .reduce((acc, item) => {
        const category = item.categoria || 'Outros';
        const itemName = item.nomeItem;

        // Inicializa estruturas se não existirem
        if (!acc[category]) acc[category] = {};
        if (!acc[category][itemName]) {
          acc[category][itemName] = { total: 0, sabores: {} };
        }
        
        // Incrementa o total do item
        acc[category][itemName].total += item.quantidade;

        // Se o item tiver um sabor específico, incrementa o contador daquele sabor
        if (item.sabor) {
          if (!acc[category][itemName].sabores[item.sabor]) {
            acc[category][itemName].sabores[item.sabor] = 0;
          }
          acc[category][itemName].sabores[item.sabor] += item.quantidade;
        }

        return acc;
      }, {} as any); // Usando 'any' para simplificar o tipo complexo do acumulador

    setComponentToPrint(<OrdersSummaryLayout summary={summary} pendingOrders={pendingOrders} />);
  };
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => { /* ... */ };
  const getStatusBadgeProps = (status: Order['status']) => { /* ... */ };

  if (loading) return <div className="flex flex-col ...">Carregando...</div>;
  if (error) return ( <div className="flex flex-col ...">Erro...</div> );

  return (
    <div>
      {/* ... Conteúdo da Página (sem alterações) ... */}
    </div>
  );
}