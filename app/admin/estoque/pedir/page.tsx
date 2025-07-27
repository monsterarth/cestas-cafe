"use client"

import React, { useState, useEffect, useMemo } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase'; // Importar getFirebaseAuth
import { onAuthStateChanged, User } from 'firebase/auth'; // Importar User
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'sonner';
import { Supplier, StockItem } from '@/types';
import { ArrowLeft, Clipboard, Check, Loader2, ShoppingCart, Send } from 'lucide-react';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';

type OrderQuantities = {
    [itemId: string]: {
        inStock: number;
        toOrder: number;
    }
}

export default function MakeStockOrderPage() {
    const [db, setDb] = useState<firestore.Firestore | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState<OrderQuantities>({});
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        async function initializeApp() {
            const firestoreDb = await getFirebaseDb();
            const auth = await getFirebaseAuth();
            if (!firestoreDb || !auth) { 
                setLoading(false); 
                toast.error("Falha ao inicializar serviços.");
                return;
            }
            setDb(firestoreDb);

            const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
                setCurrentUser(user);
            });
            
            const querySuppliers = firestore.query(firestore.collection(firestoreDb, "suppliers"), firestore.orderBy("posicao", "asc"));
            const unsubSuppliers = firestore.onSnapshot(querySuppliers, (snapshot) => {
                const suppliersData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, name: data.name, posicao: data.posicao, items: [] } as Supplier;
                });
                setSuppliers(suppliersData);
            });

            const queryItems = firestore.query(firestore.collection(firestoreDb, "stockItems"), firestore.orderBy("posicao", "asc"));
            const unsubItems = firestore.onSnapshot(queryItems, (snapshot) => {
                const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockItem[];
                setQuantities(
                    itemsData.reduce((acc, item) => {
                        acc[item.id] = { inStock: item.inStock, toOrder: item.toOrder };
                        return acc;
                    }, {} as OrderQuantities)
                );
                setSuppliers(prevSuppliers => {
                    const suppliersWithItems = prevSuppliers.map(sup => ({
                        ...sup,
                        items: itemsData.filter(item => item.supplierId === sup.id).sort((a,b) => a.posicao - b.posicao)
                    }));
                    setLoading(false);
                    return suppliersWithItems;
                });
            });

            return () => { unsubscribeAuth(); unsubSuppliers(); unsubItems(); };
        }
        initializeApp();
    }, []);

    const handleQuantityChange = (itemId: string, field: 'inStock' | 'toOrder', value: number) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value,
            }
        }));
    };

    const reviewData = useMemo(() => {
        return suppliers.map(supplier => ({
            ...supplier,
            items: supplier.items
                .filter(item => quantities[item.id]?.toOrder > 0)
                .map(item => ({...item, ...quantities[item.id]}))
        })).filter(supplier => supplier.items.length > 0);
    }, [quantities, suppliers]);

    const whatsAppMessage = useMemo(() => {
        let message = "Olá! Gostaria de fazer o seguinte pedido de compra:\n\n";
        reviewData.forEach(supplier => {
            message += `*Fornecedor: ${supplier.name}*\n`;
            supplier.items.forEach(item => {
                message += `- ${item.toOrder} ${item.unit} de ${item.name}\n`;
            });
            message += "\n";
        });
        message += "Obrigado!";
        return encodeURIComponent(message);
    }, [reviewData]);

    const handleSubmitOrder = async () => {
        if (!db || !currentUser?.email) {
            toast.error("Usuário não autenticado. Não é possível registrar o pedido.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Registrando pedidos de compra...");

        try {
            const batch = firestore.writeBatch(db);

            reviewData.forEach(supplier => {
                const orderRef = firestore.doc(firestore.collection(db, "purchaseOrders"));
                batch.set(orderRef, {
                    createdAt: firestore.serverTimestamp(),
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    requestedBy: currentUser.email, // Salva o email do usuário
                    status: 'aberto',
                    items: supplier.items.map(item => ({
                        itemId: item.id,
                        itemName: item.name,
                        unit: item.unit,
                        quantity: item.toOrder,
                        inStock: quantities[item.id].inStock // Salva o estoque acusado
                    }))
                });

                supplier.items.forEach(item => {
                    const itemRef = firestore.doc(db, "stockItems", item.id);
                    batch.update(itemRef, {
                        inStock: quantities[item.id].inStock,
                        toOrder: 0
                    });
                });
            });

            await batch.commit();
            toast.dismiss(toastId);
            toast.success("Pedidos de compra registrados e estoque atualizado!");
            setIsReviewOpen(false);

        } catch (error) {
            console.error("Erro ao registrar pedido:", error);
            toast.dismiss(toastId);
            toast.error("Ocorreu um erro ao registrar o pedido.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(decodeURIComponent(whatsAppMessage));
        setHasCopied(true);
        toast.success('Mensagem copiada!');
        setTimeout(() => setHasCopied(false), 2000);
    };

    if (loading) return <LoadingScreen message="Carregando estoque..." />;

    return (
        <>
            <Toaster richColors position="top-center" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">Fazer Pedido de Estoque</h1>
                        <p className="text-muted-foreground">Preencha o estoque atual e a quantidade a pedir para cada item.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild><Link href="/admin/estoque"><ArrowLeft className="mr-2 h-4 w-4" />Voltar à Gestão</Link></Button>
                        <Button onClick={() => setIsReviewOpen(true)} disabled={reviewData.length === 0}>
                           <ShoppingCart className="mr-2 h-4 w-4" /> Revisar Pedido ({reviewData.reduce((acc, s) => acc + s.items.length, 0)})
                        </Button>
                    </div>
                </div>

                <Accordion type="multiple" defaultValue={suppliers.map(s => s.id)} className="w-full space-y-4">
                    {suppliers.map(supplier => (
                        <AccordionItem value={supplier.id} key={supplier.id} className="border rounded-lg bg-card">
                            <AccordionTrigger className="p-4 text-lg font-semibold">{supplier.name}</AccordionTrigger>
                            <AccordionContent className="p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Produto</TableHead>
                                            <TableHead>Unidade</TableHead>
                                            <TableHead>Estoque Atual</TableHead>
                                            <TableHead>Quantidade a Pedir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {supplier.items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        className="w-24 h-9"
                                                        value={quantities[item.id]?.inStock ?? 0}
                                                        onChange={(e) => handleQuantityChange(item.id, 'inStock', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number"
                                                        className="w-24 h-9" 
                                                        value={quantities[item.id]?.toOrder ?? 0}
                                                        onChange={(e) => handleQuantityChange(item.id, 'toOrder', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Revisão do Pedido de Compra</DialogTitle>
                        <DialogDescription>Confira os itens antes de registrar o pedido. Apenas itens com quantidade "A Pedir" maior que zero são mostrados.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto my-4 space-y-4 p-1">
                        {reviewData.map(supplier => (
                            <div key={supplier.id}>
                                <h3 className="font-bold text-lg mb-2">{supplier.name}</h3>
                                <ul>
                                    {supplier.items.map(item => (
                                        <li key={item.id} className="flex justify-between py-1 border-b">
                                            <span>{item.name}</span>
                                            <span className="font-mono">{item.toOrder} {item.unit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-between gap-2">
                         <div className="relative w-full sm:w-auto">
                            <Textarea readOnly value={decodeURIComponent(whatsAppMessage)} className="pr-12 text-xs h-20" />
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8" onClick={copyToClipboard}>
                                {hasCopied ? <Check className="h-4 w-4 text-green-500"/> : <Clipboard className="h-4 w-4" />}
                            </Button>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2">
                             <Button variant="secondary" onClick={() => setIsReviewOpen(false)}>Voltar a Editar</Button>
                             <Button onClick={handleSubmitOrder} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                Registrar Pedido
                            </Button>
                         </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}