// Arquivo: app/admin/pedidos/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Order, AppConfig } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, MoreHorizontal, Clock, CheckCircle, X } from 'lucide-react';
import { usePrint } from '@/hooks/use-print';
import { OrdersSummaryLayout } from '@/components/orders-summary-layout';
import { OrderPrintLayout } from '@/components/order-print-layout';
import { OrderReceiptLayout } from '@/components/order-receipt-layout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { printComponent, isPrinting } = usePrint();

  useEffect(() => {
    const initializeListener = async () => {
      const db = await getFirebaseDb();
      if (!db) {
        toast.error('Não foi possível conectar ao banco de dados.');
        setLoading(false);
        return;
      }

      try {
        const configRef = doc(db, "configuracoes", "app");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setAppConfig(configSnap.data() as AppConfig);
        }
      } catch (e) {
        console.error("Falha ao carregar config:", e);
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
          toast.error('Falha ao carregar os pedidos.');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    };
    
    initializeListener();
  }, []);

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (order) => order.timestampPedido && new Date(order.timestampPedido.toDate()).toDateString() === today
    );
  }, [orders]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const db = await getFirebaseDb();
    if (!db) return toast.error("Sem conexão com o banco de dados.");
    await updateDoc(doc(db, 'pedidos', orderId), { status });
    toast.success(`Pedido marcado como "${status}"`);
  };

  const handlePrint = (componentToPrint: React.ReactElement) => {
    printComponent(componentToPrint);
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /> Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <CardTitle>Resumo dos Pedidos do Dia</CardTitle>
              <CardDescription>Ações para todos os pedidos de hoje ({todayOrders.length} no total).</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handlePrint(<OrdersSummaryLayout orders={todayOrders} config={appConfig} />)} disabled={isPrinting || todayOrders.length === 0}>
                    {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Imprimir Resumo
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>Todos os pedidos recebidos, dos mais recentes para os mais antigos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Hóspede</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><Badge>{order.status}</Badge></TableCell>
                    <TableCell>{order.hospedeNome} ({order.cabanaNumero})</TableCell>
                    <TableCell>{order.horarioEntrega}</TableCell>
                    <TableCell>{order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePrint(<OrderPrintLayout order={order} config={appConfig} />)}><Printer className="mr-2 h-4 w-4" />Imprimir (A4)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(<OrderReceiptLayout order={order} />)}><Printer className="mr-2 h-4 w-4" />Imprimir (Térmica)</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Em Preparação')}><Clock className="mr-2 h-4 w-4" />Marcar "Em Preparação"</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Entregue')}><CheckCircle className="mr-2 h-4 w-4" />Marcar "Entregue"</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500" onClick={() => updateOrderStatus(order.id, 'Cancelado')}><X className="mr-2 h-4 w-4" />Cancelar Pedido</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : ( <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum pedido encontrado.</TableCell></TableRow> )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}