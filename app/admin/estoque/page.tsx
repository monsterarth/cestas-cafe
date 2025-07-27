"use client"

import React, { useState, useEffect, useMemo } from 'react';
import * as firestore from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Edit, Trash2, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier, StockItem } from '@/types';
import Link from 'next/link';

// --- COMPONENTES REORDENÁVEIS ADAPTADOS ---

function SortableStockItem({ item }: { item: StockItem; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [inStock, setInStock] = useState(item.inStock);
  const [toOrder, setToOrder] = useState(item.toOrder);

  const handleQuantityChange = async (field: 'inStock' | 'toOrder', value: number) => {
    const db = await getFirebaseDb();
    if (!db) return;

    const itemRef = firestore.doc(db, "stockItems", item.id);
    try {
      await firestore.updateDoc(itemRef, { [field]: value });
      toast.success(`'${item.name}' atualizado!`);
    } catch (error) {
      toast.error(`Falha ao atualizar '${item.name}'.`);
      if (field === 'inStock') setInStock(item.inStock);
      if (field === 'toOrder') setToOrder(item.toOrder);
    }
  };

  const handleBlur = (field: 'inStock' | 'toOrder', value: number) => {
    const originalValue = item[field];
    if (value !== originalValue) {
        handleQuantityChange(field, value);
    }
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b bg-white">
      <td className="p-3 w-10"><GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} /></td>
      <td className="p-3 font-medium text-[#4B4F36]">{item.name}</td>
      <td className="p-3 w-24">{item.unit}</td>
      <td className="p-3 w-32">
        <Input type="number" value={inStock} onChange={(e) => setInStock(Number(e.target.value))} onBlur={(e) => handleBlur('inStock', Number(e.target.value))} className="h-9" />
      </td>
      <td className="p-3 w-32">
        <Input type="number" value={toOrder} onChange={(e) => setToOrder(Number(e.target.value))} onBlur={(e) => handleBlur('toOrder', Number(e.target.value))} className="h-9" />
      </td>
      <td className="p-3 text-right space-x-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => (window as any).onEditItem(item)}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => (window as any).onDeleteItem(item)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </td>
    </tr>
  );
}

function SortableSupplier({ supplier }: { supplier: Supplier; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: supplier.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const itemIds = useMemo(() => supplier.items.map((item) => item.id), [supplier.items]);

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-[#ADA192]">
      <div className="p-4 border-b border-[#ADA192] flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-4">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
          <h4 className="text-lg font-semibold text-[#4B4F36]">{supplier.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => (window as any).onAddItem(supplier.id)}><Plus className="w-4 h-4 mr-1" />Adicionar Produto</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => (window as any).onEditSupplier(supplier)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => (window as any).onDeleteSupplier(supplier.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
      </div>
      <div className="p-2 overflow-x-auto">
        <DndContext sensors={useSensors(useSensor(PointerSensor))} onDragEnd={(e) => (window as any).onItemsDragEnd(e, supplier.id)} collisionDetection={closestCenter}>
          <table className="w-full">
             <thead className="text-sm text-gray-500">
                <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-left w-24">Unidade</th>
                    <th className="p-3 text-left w-32">Em Estoque</th>
                    <th className="p-3 text-left w-32">A Pedir</th>
                    <th className="p-3 text-right">Ações</th>
                </tr>
             </thead>
            <tbody>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {supplier.items.map((item) => <SortableStockItem key={item.id} item={item} />)}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function StockPage() {
  const [db, setDb] = useState<firestore.Firestore | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; supplier?: Supplier }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; supplierId?: string; item?: Partial<StockItem> }>({ open: false });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    async function initializeData() {
      const firestoreDb = await getFirebaseDb();
      if (!firestoreDb) { setLoading(false); return; }
      setDb(firestoreDb);

      const querySuppliers = firestore.query(firestore.collection(firestoreDb, "suppliers"), firestore.orderBy("posicao", "asc"));
      const unsubSuppliers = firestore.onSnapshot(querySuppliers, (snapshot) => {
        const suppliersData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                posicao: data.posicao,
                items: []
            } as Supplier;
        });
        setSuppliers(suppliersData);
      });

      const queryItems = firestore.query(firestore.collection(firestoreDb, "stockItems"), firestore.orderBy("posicao", "asc"));
      const unsubItems = firestore.onSnapshot(queryItems, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockItem[];
        setSuppliers(prevSuppliers => {
            const suppliersWithItems = prevSuppliers.map(sup => ({
                ...sup,
                items: itemsData.filter(item => item.supplierId === sup.id).sort((a,b) => a.posicao - b.posicao)
            }));
            setLoading(false);
            return suppliersWithItems;
        });
      });
      
      return () => { 
        unsubSuppliers();
        unsubItems();
      };
    }
    initializeData();
  }, []);

  useEffect(() => {
    (window as any).onAddItem = (supplierId: string) => setItemModal({ open: true, supplierId: supplierId, item: { name: '', unit: '', inStock: 0, toOrder: 0 } });
    (window as any).onEditItem = (item: StockItem) => setItemModal({ open: true, supplierId: item.supplierId, item: item });
    (window as any).onDeleteItem = async (item: StockItem) => {
        if (!db) return; if (!confirm(`Tem certeza que deseja excluir o produto '${item.name}'?`)) return;
        try {
            await firestore.deleteDoc(firestore.doc(db, "stockItems", item.id));
            toast.success("Produto excluído!");
        } catch (error) { toast.error("Erro ao excluir produto."); }
    };
    (window as any).onEditSupplier = (supplier: Supplier) => setSupplierModal({ open: true, supplier: supplier });
    (window as any).onDeleteSupplier = async (supplierId: string) => {
        if (!db) return; if (!confirm("Tem certeza? Isso excluirá o fornecedor E TODOS os seus produtos.")) return;
        try {
            const batch = firestore.writeBatch(db);
            const itemsQuery = firestore.query(firestore.collection(db, "stockItems"), firestore.where("supplierId", "==", supplierId));
            const itemsSnapshot = await firestore.getDocs(itemsQuery);
            itemsSnapshot.forEach(doc => batch.delete(doc.ref));
            batch.delete(firestore.doc(db, "suppliers", supplierId));
            await batch.commit();
            toast.success("Fornecedor e seus produtos foram excluídos.");
        } catch (error) { toast.error("Erro ao excluir fornecedor."); }
    };
  }, [db]);


  const handleSupplierDragEnd = async (event: DragEndEvent) => {
    if (!db) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = suppliers.findIndex((s) => s.id === active.id);
    const newIndex = suppliers.findIndex((s) => s.id === over.id);
    const newSuppliers = arrayMove(suppliers, oldIndex, newIndex);
    setSuppliers(newSuppliers);
    const batch = firestore.writeBatch(db);
    newSuppliers.forEach((sup, index) => batch.update(firestore.doc(db, "suppliers", sup.id), { posicao: index }));
    await batch.commit();
    toast.success("Ordem dos fornecedores salva!");
  };

  const handleItemDragEnd = async (event: DragEndEvent, supplierId: string) => {
    if (!db) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const oldIndex = supplier.items.findIndex((i) => i.id === active.id);
    const newIndex = supplier.items.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(supplier.items, oldIndex, newIndex);

    setSuppliers(suppliers.map(s => s.id === supplierId ? { ...s, items: newItems } : s));

    const batch = firestore.writeBatch(db);
    newItems.forEach((item, index) => batch.update(firestore.doc(db, "stockItems", item.id), { posicao: index }));
    await batch.commit();
    toast.success("Ordem dos produtos salva!");
  };
  
  useEffect(() => {
    (window as any).onItemsDragEnd = handleItemDragEnd;
  }, [suppliers]);


  const handleSaveSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!db) return;
    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
    if (!name) return;
    setIsSaving(true);
    try {
      if (supplierModal.supplier) {
        await firestore.updateDoc(firestore.doc(db, "suppliers", supplierModal.supplier.id), { name });
        toast.success("Fornecedor atualizado!");
      } else {
        await firestore.addDoc(firestore.collection(db, "suppliers"), { name, posicao: suppliers.length });
        toast.success("Fornecedor criado!");
      }
      setSupplierModal({ open: false });
    } catch (error) { toast.error("Erro ao salvar fornecedor."); }
    finally { setIsSaving(false); }
  };
  
  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !itemModal.supplierId || !itemModal.item) return;

    const formData = new FormData(e.currentTarget);
    const itemData = {
        supplierId: itemModal.supplierId,
        name: formData.get("name") as string,
        unit: formData.get("unit") as string,
        inStock: Number(formData.get("inStock")),
        toOrder: Number(formData.get("toOrder")),
    };

    if (!itemData.name || !itemData.unit) {
        toast.error("Nome e Unidade são obrigatórios.");
        return;
    }
    
    setIsSaving(true);
    try {
      const supplier = suppliers.find(s => s.id === itemModal.supplierId);
      const posicao = supplier ? supplier.items.length : 0;

      if (itemModal.item.id) {
        await firestore.updateDoc(firestore.doc(db, "stockItems", itemModal.item.id), itemData);
        toast.success("Produto atualizado!");
      } else {
        await firestore.addDoc(firestore.collection(db, "stockItems"), { ...itemData, posicao });
        toast.success("Produto criado!");
      }
      setItemModal({ open: false });
    } catch (error) { toast.error("Erro ao salvar produto."); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-slate-400 animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#4B4F36]">Gestão de Estoque</h3>
        <div className='flex gap-2'>
            <Button onClick={() => setSupplierModal({ open: true })} className="bg-[#97A25F] hover:bg-[#97A25F]/90"><Plus className="w-4 h-4 mr-2" />Novo Fornecedor</Button>
            <Button asChild><Link href="/admin/estoque/pedir">Fazer Pedido de Compra</Link></Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSupplierDragEnd}>
        <div className="space-y-6">
          <SortableContext items={suppliers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {suppliers.map((supplier) => <SortableSupplier key={supplier.id} supplier={supplier} />)}
          </SortableContext>
        </div>
      </DndContext>

      {/* MODAL DE FORNECEDOR */}
      <Dialog open={supplierModal.open} onOpenChange={(open) => setSupplierModal({ open })}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{supplierModal.supplier ? "Editar" : "Adicionar"} Fornecedor</DialogTitle>
                <DialogDescription>Crie ou edite um fornecedor para seus produtos.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveSupplier} className="space-y-4 pt-4">
                <div>
                    <Label htmlFor="name">Nome do Fornecedor</Label>
                    <Input id="name" name="name" defaultValue={supplierModal.supplier?.name || ""} required />
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setSupplierModal({ open: false })}>Cancelar</Button>
                    <Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar"}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* MODAL DE PRODUTO */}
      <Dialog open={itemModal.open} onOpenChange={(open) => setItemModal({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemModal.item?.id ? "Editar" : "Adicionar"} Produto</DialogTitle>
            <DialogDescription>Adicione ou edite um produto de estoque.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
            <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" name="name" defaultValue={itemModal.item?.name || ""} required />
            </div>
            <div>
                <Label htmlFor="unit">Unidade (Ex: kg, un, pacote, L)</Label>
                <Input id="unit" name="unit" defaultValue={itemModal.item?.unit || ""} required />
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="inStock">Em Estoque</Label>
                    <Input type="number" id="inStock" name="inStock" defaultValue={itemModal.item?.inStock || 0} required />
                </div>
                <div>
                    <Label htmlFor="toOrder">A Pedir</Label>
                    <Input type="number" id="toOrder" name="toOrder" defaultValue={itemModal.item?.toOrder || 0} required />
                </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setItemModal({ open: false })}>Cancelar</Button>
              <Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}