'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertTriangle, Loader2, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Estado para controlar o modal de visualização
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    const initializeListener = async () => {
      try {
        const firestoreDb = await getFirebaseDb();
        if (!firestoreDb) throw new Error("Não foi possível conectar ao banco de dados.");
        const q = query(collection(firestoreDb, 'pedidos'), orderBy('timestampPedido', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setOrders(ordersData);
          setLoading(false);
        }, (err) => {
          console.error("Erro no listener do Firestore:", err);
          setError(err);
          setLoading(false);
        });
        return unsubscribe;
      } catch (err) {
        console.error("Erro ao inicializar listener:", err);
        setError(err as Error);
        setLoading(false);
      }
    };
    return initializeListener();
  }, []);

  useEffect(() => {
    const unsubscribePromise = fetchOrders();
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [fetchOrders]);
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const firestoreDb = await getFirebaseDb();
    if (!firestoreDb) return toast.error("Sem conexão com o banco de dados.");
    try {
      const orderRef = doc(firestoreDb, 'pedidos', orderId);
      await updateDoc(orderRef, { status });
      toast.success(`Pedido marcado como "${status}"!`);
    } catch (error) {
      toast.error('Erro ao atualizar o status do pedido.');
    }
  };
  
  const getStatusBadgeProps = (status: Order['status']) => {
    switch (status) {
      case "Novo": return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800 border-blue-200" };
      case "Em Preparação": return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800 border-amber-200" };
      case "Entregue": return { variant: "default" as const, className: "bg-green-100 text-green-800 border-green-200" };
      case "Cancelado": return { variant: "destructive" as const, className: "bg-red-100 text-red-800 border-red-200" };
      default: return { variant: "outline" as const, className: "" };
    }
  };

  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando pedidos...</span></div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">{error.message}</p> <Button onClick={fetchOrders}>Tentar Novamente</Button> </div> );

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
          {orders.length > 0 ? (
            orders.map((order) => {
              const badgeProps = getStatusBadgeProps(order.status);
              return (
                <TableRow key={order.id} onClick={() => setViewingOrder(order)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Badge variant={badgeProps.variant} className={badgeProps.className}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{order.hospedeNome}</TableCell>
                  <TableCell>{order.cabanaNumero}</TableCell>
                  <TableCell>{order.horarioEntrega}</TableCell>
                  <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                          <FileText className="mr-2 h-4 w-4" />Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Em Preparação')}><Clock className="mr-2 h-4 w-4" />Marcar "Em Preparação"</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Entregue')}><CheckCircle className="mr-2 h-4 w-4" />Marcar "Entregue"</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => updateOrderStatus(order.id, 'Cancelado')}><X className="mr-2 h-4 w-4" />Cancelar Pedido</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhum pedido encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Modal para ver detalhes do pedido */}
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido de {viewingOrder?.hospedeNome}</DialogTitle>
            <DialogDescription>Cabana {viewingOrder?.cabanaNumero} - Entrega: {viewingOrder?.horarioEntrega}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 mt-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Itens do Pedido:</h3>
              <ul className="list-disc list-inside space-y-2">
                {(viewingOrder?.itensPedido || []).map((item, i) => 
                  <li key={i}>
                    {item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}
                    {item.paraPessoa && <span className="text-xs text-muted-foreground ml-2">({item.paraPessoa})</span>}
                    {item.observacao && <p className="text-xs italic text-muted-foreground pl-5">Obs: {item.observacao}</p>}
                  </li>
                )}
              </ul>
            </div>
            {viewingOrder?.observacoesGerais && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold">Observações Gerais:</h3>
                <p className="text-sm text-muted-foreground">{viewingOrder.observacoesGerais}</p>
              </div>
            )}
            {viewingOrder?.observacoesPratosQuentes && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold">Observações (Pratos Quentes):</h3>
                <p className="text-sm text-muted-foreground">{viewingOrder.observacoesPratosQuentes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}