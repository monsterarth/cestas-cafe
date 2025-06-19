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
      const timer = setTimeout(() => window.print(), 50);
      return () => clearTimeout(timer);
    }
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [componentToPrint]);

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    if (type === 'a4') setComponentToPrint(<OrderPrintLayout order={order} />);
    else setComponentToPrint(<OrderReceiptLayout order={order} />);
  };

  const triggerSummaryPrint = () => {
    const pendingOrders = orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado");
    if (pendingOrders.length === 0) return toast.info("Nenhum pedido pendente.");
    const summary = pendingOrders.flatMap(o => o.itensPedido || []).reduce((acc, item) => {
      const category = item.categoria || 'Outros';
      const itemName = item.sabor ? `${item.nomeItem} (${item.sabor})` : item.nomeItem;
      if (!acc[category]) acc[category] = {};
      if (!acc[category][itemName]) acc[category][itemName] = 0;
      acc[category][itemName] += item.quantidade;
      return acc;
    }, {} as Record<string, Record<string, number>>);
    setComponentToPrint(<OrdersSummaryLayout summary={summary} totalOrders={pendingOrders.length} />);
  };
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => { /* ... */ };
  const deleteOrder = async (orderId: string) => { /* ... */ };
  const getStatusBadgeProps = (status: Order['status']) => { /* ... */ };

  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando pedidos...</span></div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={fetchAndSetOrders}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/> Imprimir Resumo</Button>
      </div>
      <Table>
         {/* ... Conteúdo da Tabela ... */}
      </Table>
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
         {/* ... Conteúdo do Modal ... */}
      </Dialog>
      <div className={componentToPrint ? 'print-mount-point' : 'print-container-hidden'}>
        {componentToPrint}
      </div>
    </div>
  );
}