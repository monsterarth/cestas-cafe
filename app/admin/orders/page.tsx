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

  // ===================================================================
  // NOVA LÓGICA DE IMPRESSÃO COM CSS
  // ===================================================================
  const [componentToPrint, setComponentToPrint] = useState<React.ReactElement | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setComponentToPrint(null); // Limpa o componente da tela após a impressão
    };

    // Ouve o evento 'afterprint' do navegador
    window.addEventListener('afterprint', handleAfterPrint);

    // Se houver um componente para imprimir, chama a impressão do navegador
    if (componentToPrint) {
      window.print();
    }

    // Limpa o listener quando o componente é desmontado
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
    const summary = pendingOrders
      .flatMap(order => order.itensPedido || [])
      .reduce((acc, item) => {
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


  const fetchOrders = useCallback(async () => { /*...código da função sem alterações...*/ }, []);
  useEffect(() => { /*...código do useEffect sem alterações...*/ }, [fetchOrders]);
  const updateOrderStatus = async (orderId: string, status: Order['status']) => { /*...código existente...*/ };
  const deleteOrder = async (orderId: string) => { /*...código existente...*/ };
  const getStatusBadgeProps = (status: Order['status']) => { /*...código existente...*/ };

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando pedidos...</div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">Erro ao Carregar os Pedidos</h2> <p className="text-muted-foreground">Não foi possível conectar ao banco de dados.</p> <Button onClick={fetchOrders}>Tentar Novamente</Button> </div> );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSummaryPrint}><Printer className="mr-2 h-4 w-4"/> Imprimir Resumo da Cozinha</Button>
      </div>

      <Table>
        {/* ... Seu TableHeader e TableBody (sem alterações)... */}
      </Table>
      
      <Dialog open={!!viewingOrder} onOpenChange={(isOpen) => !isOpen && setViewingOrder(null)}>
        {/* ... Conteúdo do Modal de Detalhes (sem alterações) ... */}
      </Dialog>
      
      {/* A área de impressão agora usa a classe CSS que criamos */}
      <div className={componentToPrint ? 'print-section' : 'hidden'}>
        {componentToPrint}
      </div>
    </div>
  );
}