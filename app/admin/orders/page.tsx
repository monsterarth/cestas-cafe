'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function OrdersPage() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  const printA4Ref = useRef<HTMLDivElement>(null);
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const printSummaryRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setError(null);
    setLoading(true);

    try {
      const firestoreDb = await getFirebaseDb();
      if (!firestoreDb) throw new Error("Não foi possível conectar ao banco de dados.");
      setDb(firestoreDb);

      const q = query(collection(firestoreDb, 'pedidos'), orderBy('timestampPedido', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setLoading(false);
      }, (err) => {
        console.error("Erro no listener do Firestore:", err);
        setError(err);
        setLoading(false);
        toast.error("Erro ao receber atualizações de pedidos.");
      });

      return unsubscribe;

    } catch (err: any) {
      console.error("Erro ao buscar pedidos:", err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initialize = async () => {
      unsubscribe = await fetchOrders();
    };

    initialize();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // ===================================================================
  // CORREÇÃO APLICADA ABAIXO
  // ===================================================================
  // @ts-ignore - Ignorando o erro de tipo da biblioteca desatualizada
  const handlePrintA4 = useReactToPrint({ content: () => printA4Ref.current });
  // @ts-ignore - Ignorando o erro de tipo da biblioteca desatualizada
  const handlePrintReceipt = useReactToPrint({ content: () => printReceiptRef.current });
  // @ts-ignore - Ignorando o erro de tipo da biblioteca desatualizada
  const handlePrintSummary = useReactToPrint({ content: () => printSummaryRef.current });

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    setOrderToPrint(order);
    setTimeout(() => {
      if (type === 'a4') handlePrintA4();
      else handlePrintReceipt();
    }, 0);
  };

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
        const itemName = item.sabor ? `${item.nomeItem} (${item.sabor})` : item.nomeItem;
        
        if (!acc[category]) acc[category] = {};
        if (!acc[category][itemName]) acc[category][itemName] = 0;
        
        acc[category][itemName] += item.quantidade;
        return acc;
      }, {} as any);

    setSummaryData({ summary, totalOrders: pendingOrders.length });
    setTimeout(() => handlePrintSummary(), 0);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!db) return;
    try {
      const orderRef = doc(db, 'pedidos', orderId);
      await updateDoc(orderRef, { status });
      toast.success(`Pedido marcado como "${status}"!`);
    } catch (error) {
      toast.error('Erro ao atualizar o status do pedido.');
      console.error(error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if(!db) return;
    if(!confirm('Tem certeza que deseja excluir este pedido permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'pedidos', orderId));
      toast.success('Pedido excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir o pedido.');
      console.error(error);
    }
  };
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "Novo": return "bg-blue-100 text-blue-800";
      case "Em Preparação": return "bg-amber-100 text-amber-800";
      case "Entregue": return "bg-green-100 text-green-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando pedidos...</div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">Não foi possível conectar ao banco de dados.</p> <Button onClick={fetchOrders}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSummaryPrint}>
          <Printer className="mr-2 h-4 w-4"/> Imprimir Resumo da Cozinha
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Hóspede</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Data do Pedido</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} onClick={() => setViewingOrder(order)} className="cursor-pointer">
              <TableCell><Badge className={getStatusColor(order.status)}>{order.status}</Badge></TableCell>
              <TableCell>{order.hospedeNome} ({order.cabanaNumero})</TableCell>
              <TableCell>{order.horarioEntrega}</TableCell>
              <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); setViewingOrder(order);}}><FileText className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); triggerPrint(order, 'a4');}}><Printer className="mr-2 h-4 w-4" /> Imprimir (A4)</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); triggerPrint(order, 'receipt');}}><Printer className="mr-2 h-4 w-4" /> Imprimir (Comanda)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); updateOrderStatus(order.id, 'Em Preparação');}}><Clock className="mr-2 h-4 w-4" />Marcar "Em Preparação"</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); updateOrderStatus(order.id, 'Entregue');}}><CheckCircle className="mr-2 h-4 w-4" />Marcar "Entregue"</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => {e.stopPropagation(); updateOrderStatus(order.id, 'Cancelado');}}><X className="mr-2 h-4 w-4" />Cancelar Pedido</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
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
                {(viewingOrder?.itensPedido || []).map((item, i) => <li key={i}>{item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}</li>)}
              </ul>
            </div>
            {viewingOrder?.observacoesGerais && <div><h3 className="font-semibold">Observações Gerais:</h3><p className="text-sm text-muted-foreground">{viewingOrder.observacoesGerais}</p></div>}
            {viewingOrder?.observacoesPratosQuentes && <div><h3 className="font-semibold">Obs. Pratos Quentes:</h3><p className="text-sm text-muted-foreground">{viewingOrder.observacoesPratosQuentes}</p></div>}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {orderToPrint && <OrderPrintLayout ref={printA4Ref} order={orderToPrint} />}
        {orderToPrint && <OrderReceiptLayout ref={printReceiptRef} order={orderToPrint} />}
        {summaryData && <OrdersSummaryLayout ref={printSummaryRef} summary={summaryData.summary} totalOrders={summaryData.totalOrders} />}
      </div>
    </div>
  );
}