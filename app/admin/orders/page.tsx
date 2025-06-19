// Arquivo: app/admin/orders/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order, ItemPedido, AppConfig } from '@/types';
import { OrderPrintLayout } from '@/components/order-print-layout';
import { OrderReceiptLayout } from '@/components/order-receipt-layout';
// CORREÇÃO 1: Importação ajustada para default (sem chaves)
import OrdersSummaryLayout from '@/components/orders-summary-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Printer, AlertTriangle, Loader2, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [componentToPrint, setComponentToPrint] = useState<React.ReactElement | null>(null);
  const [retryFetch, setRetryFetch] = useState(0);
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPrintContainer(document.getElementById('print-container'));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        const db = await getFirebaseDb();
        if (!db) {
            toast.error("Falha na conexão com o banco de dados.");
            setLoading(false);
            return;
        }

        try {
            const configRef = doc(db, "configuracoes", "app");
            const configSnap = await getDoc(configRef);
            if(configSnap.exists()) {
                setAppConfig(configSnap.data() as AppConfig);
            }
        } catch(e) {
            toast.error("Falha ao carregar configurações do app.");
            console.error(e);
        }

        const q = query(collection(db, 'pedidos'), orderBy('timestampPedido', 'desc'));
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setOrders(ordersData);
                setLoading(false);
            },
            (err) => {
                console.error("Erro no listener de pedidos:", err);
                setError(err as Error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    };
    
    fetchInitialData();
  }, [retryFetch]);

  useEffect(() => {
    const handleAfterPrint = () => setComponentToPrint(null);
    
    if (componentToPrint) {
        window.addEventListener('afterprint', handleAfterPrint, { once: true });
        const timer = setTimeout(() => {
            window.print();
        }, 150);
        return () => clearTimeout(timer);
    } else {
        window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [componentToPrint]);

  const triggerPrint = (order: Order, type: 'a4' | 'receipt') => {
    if (type === 'a4') {
      // CORREÇÃO 2: Passando a prop 'config' que estava faltando
      setComponentToPrint(<OrderPrintLayout order={order} config={appConfig} />);
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
    setComponentToPrint(<OrdersSummaryLayout orders={pendingOrders} config={appConfig} />);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const db = await getFirebaseDb();
    if (!db) {
      toast.error("Sem conexão com o banco de dados.");
      return;
    }
    await updateDoc(doc(db, 'pedidos', orderId), { status });
    toast.success(`Pedido marcado como "${status}"`);
  };

  const getStatusBadgeProps = (status: Order['status']) => {
    switch (status) {
      case "Novo": return { className: "bg-blue-100 text-blue-800" };
      case "Em Preparação": return { className: "bg-amber-100 text-amber-800" };
      case "Entregue": return { className: "bg-green-100 text-green-800" };
      case "Cancelado": return { className: "bg-red-100 text-red-800" };
      default: return { variant: "outline" as const };
    }
  };

  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando...</span></div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={() => setRetryFetch(c => c + 1)}>Tentar Novamente</Button> </div> );

  return (
    <>
      <div>
        <div className="flex justify-end mb-4"><Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/>Imprimir Resumo da Cozinha</Button></div>
        <Table>
            <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Hóspede</TableHead><TableHead>Entrega</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
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
                    <ul className="list-disc list-inside space-y-2">{(viewingOrder?.itensPedido || []).map((item, i) => <li key={i}>{item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}</li>)}</ul>
                </div>
            </div>
            </DialogContent>
        </Dialog>
      </div>

      {printContainer && componentToPrint && createPortal(componentToPrint, printContainer)}
    </>
  );
}