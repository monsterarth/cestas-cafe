'use client'

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore'; // CORREÇÃO AQUI
import { getFirebaseDb } from '@/lib/firebase';
import type { PurchaseOrder, AppConfig } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, MoreHorizontal, CheckCircle, X, Archive, ArchiveRestore } from 'lucide-react';
import { usePrint } from '@/hooks/use-print';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PurchaseOrderPrintLayout } from '@/components/purchase-order-print-layout';
import { PurchaseOrdersSummaryLayout } from '@/components/purchase-orders-summary-layout';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const { printComponent, isPrinting } = usePrint();
    const [selectedOrders, setSelectedOrders] = useState<PurchaseOrder[]>([]);
    const [hideCompleted, setHideCompleted] = useState(true);

    useEffect(() => {
        const initializeListener = async () => {
            const db = await getFirebaseDb();
            if (!db) { toast.error('Não foi possível conectar ao banco de dados.'); setLoading(false); return; }
            try {
                const configRef = doc(db, "configuracoes", "app");
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) { setAppConfig(configSnap.data() as AppConfig); }
            } catch (e) { console.error("Falha ao carregar config:", e); }
            
            const q = query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
                setOrders(ordersData); setLoading(false);
            }, (err) => {
                console.error("Erro no listener de pedidos de compra:", err);
                toast.error('Falha ao carregar os pedidos de compra.'); setLoading(false);
            });
            return () => unsubscribe();
        };
        initializeListener();
    }, []);

    const filteredOrders = useMemo(() => {
        if (hideCompleted) {
            return orders.filter(order => order.status !== 'concluido' && order.status !== 'arquivado');
        }
        return orders;
    }, [orders, hideCompleted]);

    const handleSelectOrder = (order: PurchaseOrder, isSelected: boolean) => {
        if (isSelected) { setSelectedOrders(prev => [...prev, order]); } 
        else { setSelectedOrders(prev => prev.filter(o => o.id !== order.id)); }
    };

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) { setSelectedOrders(filteredOrders); }
        else { setSelectedOrders([]); }
    };

    const updateOrderStatus = async (orderId: string, status: PurchaseOrder['status']) => {
        const db = await getFirebaseDb();
        if (!db) return toast.error("Sem conexão com o banco de dados.");
        await updateDoc(doc(db, 'purchaseOrders', orderId), { status });
        toast.success(`Pedido de compra marcado como "${status}"`);
    };

    const handlePrint = (componentToPrint: React.ReactElement) => { printComponent(componentToPrint); };
    
    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /> Carregando pedidos...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <CardTitle>Controle de Pedidos de Compra</CardTitle>
                            <CardDescription>Gerencie e imprima os pedidos de compra para seus fornecedores.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="hide-completed" checked={hideCompleted} onCheckedChange={setHideCompleted} />
                                <Label htmlFor="hide-completed" className="flex items-center gap-2 cursor-pointer">
                                    {hideCompleted ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                                    <span>{hideCompleted ? 'Esconder Concluídos' : 'Mostrar Todos'}</span>
                                </Label>
                            </div>
                            <Button onClick={() => handlePrint(<PurchaseOrdersSummaryLayout orders={selectedOrders} config={appConfig} />)} disabled={isPrinting || selectedOrders.length === 0}>
                                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                                Imprimir Resumo ({selectedOrders.length})
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Lista de Pedidos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                                        aria-label="Selecionar todos os pedidos visíveis"
                                    />
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fornecedor</TableHead>
                                <TableHead>Solicitante</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} data-state={selectedOrders.some(o => o.id === order.id) ? "selected" : ""}>
                                        <TableCell><Checkbox onCheckedChange={(checked) => handleSelectOrder(order, !!checked)} checked={selectedOrders.some(o => o.id === order.id)} /></TableCell>
                                        <TableCell><Badge>{order.status}</Badge></TableCell>
                                        <TableCell className="font-medium">{order.supplierName}</TableCell>
                                        <TableCell>{order.requestedBy}</TableCell>
                                        <TableCell>{order.createdAt?.toDate ? format(order.createdAt.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações do Pedido</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handlePrint(<PurchaseOrderPrintLayout order={order} config={appConfig} />)}><Printer className="mr-2 h-4 w-4" />Imprimir Pedido</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'concluido')}><CheckCircle className="mr-2 h-4 w-4" />Marcar "Concluído"</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'arquivado')}><Archive className="mr-2 h-4 w-4" />Arquivar Pedido</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500" onClick={() => updateOrderStatus(order.id, 'aberto')}><X className="mr-2 h-4 w-4" />Reabrir Pedido</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : ( <TableRow><TableCell colSpan={6} className="text-center h-24">{hideCompleted ? 'Nenhum pedido ativo encontrado.' : 'Nenhum pedido encontrado.'}</TableCell></TableRow> )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}