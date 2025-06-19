'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { useReactToPrint } from 'react-to-print';
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
  const printRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => { /* ...código da função sem alterações... */ }, []);
  useEffect(() => { /* ...código do useEffect sem alterações... */ }, [fetchOrders]);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setComponentToPrint(null),
  });

  useEffect(() => {
    if (componentToPrint) {
      handlePrint();
    }
  }, [componentToPrint, handlePrint]);
  
  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    if (type === 'a4') {
      setComponentToPrint(<OrderPrintLayout order={order} ref={printRef} />);
    } else {
      setComponentToPrint(<OrderReceiptLayout order={order} ref={printRef} />);
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
    setComponentToPrint(<OrdersSummaryLayout summary={summaryData.summary} totalOrders={summaryData.totalOrders} ref={printRef} />);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => { /* ...código existente...*/ };
  const deleteOrder = async (orderId: string) => { /* ...código existente...*/ };
  const getStatusBadgeProps = (status: Order['status']) => { /* ...código existente...*/ };

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando pedidos...</div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={fetchOrders}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/> Imprimir Resumo</Button>
      </div>
      <Table>
         {/* ... TableHeader e TableBody (sem alterações, mas com o onClick corrigido abaixo) ... */}
         <TableBody>
          {orders.map((order) => {
            const badgeProps = getStatusBadgeProps(order.status);
            return (
              <TableRow key={order.id} onClick={() => setViewingOrder(order)} className="cursor-pointer">
                 {/* ... O resto da sua TableRow (sem alterações) ... */}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      {/* CORREÇÃO: Conteúdo do Modal agora é renderizado corretamente */}
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido de {viewingOrder?.hospedeNome}</DialogTitle>
            <DialogDescription>Cabana {viewingOrder?.cabanaNumero} - Entrega: {viewingOrder?.horarioEntrega}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 mt-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Itens:</h3>
              <ul className="list-disc list-inside space-y-1">
                {(viewingOrder?.itensPedido || []).map((item, i) => 
                  <li key={i}>
                    {item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}
                    {item.paraPessoa && <span className="text-xs text-muted-foreground ml-2">({item.paraPessoa})</span>}
                    {item.observacao && <p className="text-xs italic text-muted-foreground pl-5">Obs: {item.observacao}</p>}
                  </li>
                )}
              </ul>
            </div>
            {viewingOrder?.observacoesGerais && <div><h3 className="font-semibold">Observações Gerais:</h3><p className="text-sm text-muted-foreground">{viewingOrder.observacoesGerais}</p></div>}
            {viewingOrder?.observacoesPratosQuentes && <div><h3 className="font-semibold">Obs. Pratos Quentes:</h3><p className="text-sm text-muted-foreground">{viewingOrder.observacoesPratosQuentes}</p></div>}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* CORREÇÃO: A área de impressão usa a nova classe CSS */}
      <div className={componentToPrint ? 'print-mount-point' : 'print-container-hidden'}>
        {componentToPrint}
      </div>
    </div>
  );
}