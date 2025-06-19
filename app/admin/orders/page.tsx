'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { OrderPrintLayout } from '@/components/order-print-layout';
import { OrderReceiptLayout } from '@/components/order-receipt-layout';
import { OrdersSummaryLayout } from '@/components/orders-summary-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Printer, AlertTriangle, Trash2, CheckCircle, Clock, Loader2, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type SummaryData = {
  summary: Record<string, Record<string, number>>;
  totalOrders: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [componentToPrint, setComponentToPrint] = useState<React.ReactElement | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const firestoreDb = await getFirebaseDb();
      if (!firestoreDb) throw new Error("Não foi possível conectar ao banco de dados.");
      const q = query(collection(firestoreDb, 'pedidos'), orderBy('timestampPedido', 'desc'));
      return onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setLoading(false);
      }, (err) => {
        console.error("Erro no listener do Firestore:", err);
        setError(err);
        setLoading(false);
      });
    } catch (err: any) {
      console.error("Erro ao buscar pedidos:", err);
      setError(err);
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initialize = async () => { unsubscribe = await fetchOrders(); };
    initialize();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [fetchOrders]);
  
  useEffect(() => {
    const handleAfterPrint = () => {
      setComponentToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    if (componentToPrint) {
      window.print();
    }
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [componentToPrint]);

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    if (type === 'a4') {
      setComponentToPrint(<OrderPrintLayout order={order} />);
    } else {
      setComponentToPrint(<OrderReceiptLayout order={order} />);
    }
  };

  const triggerSummaryPrint = () => {
    const pendingOrders = orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado");
    if (pendingOrders.length === 0) {
      toast.info("Nenhum pedido pendente para gerar resumo.");
      return;
    }
    const summary = pendingOrders.flatMap(o => o.itensPedido || []).reduce((acc, item) => {
      const category = item.categoria || 'Outros';
      const itemName = item.sabor ? `${item.nomeItem} (${item.sabor})` : item.nomeItem;
      if (!acc[category]) acc[category] = {};
      if (!acc[category][itemName]) acc[category][itemName] = 0;
      acc[category][itemName] += item.quantidade;
      return acc;
    }, {} as Record<string, Record<string, number>>);
    const summaryData = { summary, totalOrders: pendingOrders.length };
    setComponentToPrint(<OrdersSummaryLayout summary={summaryData.summary} totalOrders={summaryData.totalOrders} />);
  };
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => { /*...código existente...*/ };
  const deleteOrder = async (orderId: string) => { /*...código existente...*/ };
  const getStatusBadgeProps = (status: Order['status']) => { /*...código existente...*/ };

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando pedidos...</div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={fetchOrders}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/> Imprimir Resumo</Button>
      </div>
      <Table>
         {/* ... TableHeader e TableBody (sem alterações) ... */}
      </Table>
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
        {/* ... Conteúdo do Modal (sem alterações) ... */}
      </Dialog>
      
      <div className="print-section">
        {componentToPrint}
      </div>
    </div>
  );
}