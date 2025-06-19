'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order, ItemPedido } from '@/types'; // CORRIGIDO: Usa 'Order' e importa 'ItemPedido'
import { OrderPrintLayout } from '@/components/order-print-layout'; // CORRIGIDO: Importação nomeada
import { OrderReceiptLayout } from '@/components/order-receipt-layout'; // CORRIGIDO: Importação nomeada
import { OrdersSummaryLayout } from '@/components/orders-summary-layout'; // CORRIGIDO: Importação nomeada
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Printer, AlertTriangle, Loader2, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Adicionando uma interface para o resumo, para evitar o tipo 'any'
interface AggregatedSummary {
  [category: string]: {
    [itemName: string]: {
      total: number;
      sabores: Record<string, number>;
    };
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]); // CORRIGIDO: Usa 'Order'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null); // CORRIGIDO: Usa 'Order'
  const [componentToPrint, setComponentToPrint] = useState<React.ReactElement | null>(null);
  const [retryFetch, setRetryFetch] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribe: (() => void) | undefined;

    // CORRIGIDO: Usa getFirebaseDb()
    getFirebaseDb().then(db => {
      if (!db) {
          setError(new Error("A conexão com o banco de dados falhou."));
          setLoading(false);
          return;
      }
      
      const q = query(collection(db, 'pedidos'), orderBy('timestampPedido', 'desc'));
      unsubscribe = onSnapshot(q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)); // CORRIGIDO: Usa 'Order'
          setOrders(ordersData);
          setLoading(false);
        },
        (err) => {
          console.error("Erro no listener:", err);
          setError(err);
          setLoading(false);
        }
      );
    }).catch(err => {
      console.error("Erro ao inicializar:", err);
      setError(err);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [retryFetch]);

  useEffect(() => {
    const handleAfterPrint = () => setComponentToPrint(null);
    window.addEventListener('afterprint', handleAfterPrint);
    if (componentToPrint) {
      const timer = setTimeout(() => window.print(), 100);
      return () => clearTimeout(timer);
    }
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [componentToPrint]);

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => { // CORRIGIDO: Usa 'Order'
    if (type === 'a4') setComponentToPrint(<OrderPrintLayout order={order} />);
    else setComponentToPrint(<OrderReceiptLayout order={order} />);
  };

  const triggerSummaryPrint = () => {
    const pendingOrders = orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado");
    if (pendingOrders.length === 0) {
      toast.info("Nenhum pedido pendente para gerar resumo.");
      return;
    }
    
    // CORRIGIDO: Adiciona tipos para 'acc' e 'item' para resolver erros de 'implicit any'
    const summary = pendingOrders.flatMap(o => o.itensPedido || []).reduce((acc: AggregatedSummary, item: ItemPedido) => {
      const category = item.categoria || 'Outros';
      const itemName = item.nomeItem;
      if (!acc[category]) acc[category] = {};
      if (!acc[category][itemName]) acc[category][itemName] = { total: 0, sabores: {} };
      acc[category][itemName].total += item.quantidade;
      if (item.sabor) {
        if (!acc[category][itemName].sabores[item.sabor]) acc[category][itemName].sabores[item.sabor] = 0;
        acc[category][itemName].sabores[item.sabor] += item.quantidade;
      }
      return acc;
    }, {} as AggregatedSummary);
    setComponentToPrint(<OrdersSummaryLayout summary={summary} pendingOrders={pendingOrders} />);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => { // CORRIGIDO: Usa 'Order'
    const db = await getFirebaseDb();
    if (!db) {
      toast.error("Sem conexão com o banco de dados.");
      return;
    }
    await updateDoc(doc(db, 'pedidos', orderId), { status });
    toast.success(`Pedido marcado como "${status}"`);
  };

  const getStatusBadgeProps = (status: Order['status']) => { // CORRIGIDO: Usa 'Order'
    switch (status) {
      case "Novo": return { className: "bg-blue-100 text-blue-800" };
      case "Em Preparação": return { className: "bg-amber-100 text-amber-800" };
      case "Entregue": return { className: "bg-green-100 text-green-800" };
      case "Cancelado": return { className: "bg-red-100 text-red-800" };
      default: return { variant: "outline" as const };
    }
  };

  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando pedidos...</span></div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={() => setRetryFetch(c => c + 1)}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4"><Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/>Imprimir Resumo da Cozinha</Button></div>
      <Table>
        <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Hóspede</TableHead><TableHead>Entrega</TableHead><TableHead>Data do Pedido</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id} onClick={() => setViewingOrder(order)} className="cursor-pointer hover:bg-muted/50">
                <TableCell><Badge {...getStatusBadgeProps(order.status)}>{order.status}</Badge></TableCell>
                <TableCell>{order.hospedeNome} ({order.cabanaNumero})</TableCell>
                <TableCell>{order.horarioEntrega}</TableCell>
                <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => triggerPrint(order, 'a4')}><Printer className="mr-2 h-4 w-4" />Imprimir (A4)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => triggerPrint(order, 'receipt')}><Printer className="mr-2 h-4 w-4" />Imprimir (Comanda)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Em Preparação')}><Clock className="mr-2 h-4 w-4" />Marcar "Em Preparação"</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Entregue')}><CheckCircle className="mr-2 h-4 w-4" />Marcar "Entregue"</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => updateOrderStatus(order.id, 'Cancelado')}><X className="mr-2 h-4 w-4" />Cancelar Pedido</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : ( <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum pedido encontrado.</TableCell></TableRow> )}
        </TableBody>
      </Table>
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Pedido de {viewingOrder?.hospedeNome}</DialogTitle><DialogDescription>Cabana {viewingOrder?.cabanaNumero} - Entrega: {viewingOrder?.horarioEntrega}</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 mt-4 space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Itens:</h3>
                {/* CORRIGIDO: Adiciona tipos para 'item' e 'i' para resolver erros de 'implicit any' */}
                <ul className="list-disc list-inside space-y-2">{(viewingOrder?.itensPedido || []).map((item: ItemPedido, i: number) => <li key={i}>{item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}</li>)}</ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className={componentToPrint ? 'print-mount-point' : 'print-container-hidden'}>
        {componentToPrint}
      </div>
    </div>
  );
}