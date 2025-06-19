'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { useReactToPrint } from 'react-to-print';
import { OrderPrintLayout } from '@/components/order-print-layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Printer, AlertTriangle, Trash2, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
  });

  const triggerPrint = (order: Order) => {
    setSelectedOrderForPrint(order);
    setTimeout(() => handlePrint(), 0);
  };
  
  const updateOrderStatus = async (orderId: string, status: "Novo" | "Em Preparação" | "Entregue" | "Cancelado") => {
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
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "Novo": return "bg-blue-100 text-blue-800";
      case "Em Preparação": return "bg-amber-100 text-amber-800";
      case "Entregue": return "bg-green-100 text-green-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando pedidos...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2>
        <p className="text-muted-foreground">Não foi possível conectar ao banco de dados para buscar os pedidos.</p>
        <Button onClick={fetchOrders}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Hóspede</TableHead>
            <TableHead>Cabana</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Data do Pedido</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </TableCell>
              {/* CORREÇÃO: Usando os nomes corretos */}
              <TableCell>{order.hospedeNome}</TableCell>
              <TableCell>{order.cabanaNumero}</TableCell>
              <TableCell>{order.horarioEntrega}</TableCell>
              <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => triggerPrint(order)}>
                      <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Em Preparação')}>
                       <Clock className="mr-2 h-4 w-4" /> Marcar como "Em Preparação"
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Entregue')}>
                       <CheckCircle className="mr-2 h-4 w-4" /> Marcar como "Entregue"
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => updateOrderStatus(order.id, 'Cancelado')}>
                      <Trash2 className="mr-2 h-4 w-4" /> Cancelar Pedido
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="hidden">
        {selectedOrderForPrint && <OrderPrintLayout ref={printComponentRef} order={selectedOrderForPrint} />}
      </div>
    </div>
  );
}