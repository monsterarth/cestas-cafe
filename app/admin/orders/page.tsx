'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);

    const initializeListener = async () => {
      try {
        const firestoreDb = await getFirebaseDb();
        if (!firestoreDb) {
          throw new Error("Não foi possível conectar ao banco de dados.");
        }
        
        const q = query(collection(firestoreDb, 'pedidos'), orderBy('timestampPedido', 'desc'));
        
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(ordersData);
            setLoading(false);
          }, 
          (err) => {
            console.error("Erro no listener do Firestore:", err);
            setError(err);
            setLoading(false);
          }
        );
        
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
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [fetchOrders]);
  
  if (loading) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span>Carregando pedidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2>
        <p className="text-muted-foreground">{error.message}</p>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Badge>{order.status}</Badge>
                </TableCell>
                <TableCell>{order.hospedeNome}</TableCell>
                <TableCell>{order.cabanaNumero}</TableCell>
                <TableCell>{order.horarioEntrega}</TableCell>
                <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                Nenhum pedido encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}