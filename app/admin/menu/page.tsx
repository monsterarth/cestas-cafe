export const dynamic = 'force-dynamic';

"use client"

import { useState, useEffect, useMemo } from "react"
import * as firestore from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Edit, Trash2, Sandwich, Loader2 } from "lucide-react"
import { toast } from 'sonner';

// --- TIPOS DE DADOS ---
interface Flavor {
  id: string;
  nomeSabor: string;
  disponivel: boolean;
  posicao: number;
}

interface MenuItem {
  id: string;
  nomeItem: string;
  emoji?: string;
  disponivel: boolean;
  descricaoPorcao?: string;
  imageUrl?: string;
  posicao: number;
  sabores?: Flavor[];
}

interface MenuCategory {
  id: string;
  nomeCategoria: string;
  posicao: number;
  items: MenuItem[];
}

// --- COMPONENTES REORDENÁVEIS ---

function SortableFlavorItem({ flavor, onEdit, onDelete }: { flavor: Flavor; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: flavor.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
      <div className="flex items-center gap-2">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
        <span>{flavor.nomeSabor}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${flavor.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {flavor.disponivel ? "Ativo" : "Inativo"}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    </div>
  );
}

function SortableItem({ item, isHotDish, ...props }: { item: MenuItem; isHotDish: boolean; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className="border-b bg-white">
      <td className="p-3 w-10"><GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} /></td>
      <td className="p-3">
        <div className="flex items-center gap-4">
          {item.imageUrl && <img src={item.imageUrl} alt={item.nomeItem} className="w-12 h-12 object-cover rounded-md" />}
          <span className="font-medium text-[#4B4F36]">{item.nomeItem}</span>
        </div>
      </td>
      <td className="p-3">
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${item.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {item.disponivel ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="p-3 text-right space-x-1">
        {isHotDish && <Button variant="outline" size="sm" onClick={props.onManageFlavors}><Sandwich className="w-4 h-4 mr-2" />Sabores</Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={props.onEditItem}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={props.onDeleteItem}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </td>
    </tr>
  );
}

function SortableCategory({ category, ...props }: { category: MenuCategory; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const itemIds = useMemo(() => category.items.map((item) => item.id), [category.items]);
  const isHotDishCategory = category.nomeCategoria.toLowerCase().includes("pratos quentes");

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-[#ADA192]">
      <div className="p-4 border-b border-[#ADA192] flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-4">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
          <h4 className="text-lg font-semibold text-[#4B4F36]">{category.nomeCategoria}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => props.onAddItem(category.id)}><Plus className="w-4 h-4 mr-1" />Adicionar Item</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.onEditCategory(category)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.onDeleteCategory(category.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
      </div>
      <div className="p-2 overflow-x-auto">
        <DndContext sensors={useSensors(useSensor(PointerSensor))} onDragEnd={(e) => props.onItemsDragEnd(e, category.id)} collisionDetection={closestCenter}>
          <table className="w-full">
            <tbody>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {category.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    isHotDish={isHotDishCategory}
                    onEditItem={() => props.onEditItem(category.id, item)}
                    onDeleteItem={() => props.onDeleteItem(category.id, item.id)}
                    onManageFlavors={() => props.onManageFlavors(category.id, item)}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function MenuPage() {
  const [db, setDb] = useState<firestore.Firestore | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: MenuCategory }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; categoryId?: string; item?: Partial<MenuItem> }>({ open: false });
  const [flavorModal, setFlavorModal] = useState<{ open: boolean; categoryId?: string; itemId?: string; flavors: Flavor[]; itemNome?: string }>({ open: false, flavors: [] });
  const [currentFlavor, setCurrentFlavor] = useState<Flavor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    async function initializeDbAndListener() {
      const firestoreDb = await getFirebaseDb();
      if (!firestoreDb) { setLoading(false); return; }
      setDb(firestoreDb);

      const menuQuery = firestore.query(firestore.collection(firestoreDb, "cardapio"), firestore.orderBy("posicao", "asc"));
      
      const unsubscribe = firestore.onSnapshot(menuQuery, async (snapshot) => {
        setLoading(true);
        const categoriesData = await Promise.all(snapshot.docs.map(async (categoryDoc) => {
          const categoryData = categoryDoc.data();
          const itemsQuery = firestore.query(firestore.collection(firestoreDb, "cardapio", categoryDoc.id, "itens"), firestore.orderBy("posicao", "asc"));
          const itemsSnapshot = await firestore.getDocs(itemsQuery);
          
          const items = await Promise.all(itemsSnapshot.docs.map(async (itemDoc) => {
            const itemData = itemDoc.data();
            const flavorsQuery = firestore.query(firestore.collection(itemDoc.ref, "sabores"), firestore.orderBy("posicao", "asc"));
            const flavorsSnapshot = await firestore.getDocs(flavorsQuery);
            const sabores = flavorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Flavor[];
            return { id: itemDoc.id, ...itemData, sabores } as MenuItem;
          }));
          
          return { id: categoryDoc.id, ...categoryData, items } as MenuCategory;
        }));
        setCategories(categoriesData);
        setLoading(false);
      }, (error) => { console.error("Error loading menu:", error); setLoading(false); toast.error("Falha ao carregar o cardápio."); });
      
      return unsubscribe;
    }

    const unsubscribePromise = initializeDbAndListener();
    return () => { unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe()); };
  }, []);
  
  // Lógica de arrastar e soltar (sem alterações)
  const handleDragEnd = async (event: DragEndEvent, context: 'categories' | 'items' | 'flavors', parentId?: string, grandParentId?: string) => {
    if (!db) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (context === 'categories') {
        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);
        const batch = firestore.writeBatch(db);
        newCategories.forEach((cat, index) => batch.update(firestore.doc(db, "cardapio", cat.id), { posicao: index }));
        await batch.commit();
        toast.success("Ordem das categorias salva!");
    } else if (context === 'items' && parentId) {
        const category = categories.find(c => c.id === parentId);
        if (!category) return;
        const oldIndex = category.items.findIndex((i) => i.id === active.id);
        const newIndex = category.items.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newItems = arrayMove(category.items, oldIndex, newIndex);
        setCategories(categories.map(c => c.id === parentId ? { ...c, items: newItems } : c));
        const batch = firestore.writeBatch(db);
        newItems.forEach((item, index) => batch.update(firestore.doc(db, "cardapio", parentId, "itens", item.id), { posicao: index }));
        await batch.commit();
        toast.success("Ordem dos itens salva!");
    } else if (context === 'flavors' && parentId && grandParentId) {
        const category = categories.find(c => c.id === grandParentId);
        const item = category?.items.find(i => i.id === parentId);
        if (!item || !item.sabores) return;
        const oldIndex = item.sabores.findIndex(f => f.id === active.id);
        const newIndex = item.sabores.findIndex(f => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newFlavors = arrayMove(item.sabores, oldIndex, newIndex);
        setFlavorModal(prev => ({ ...prev, flavors: newFlavors }));
        const batch = firestore.writeBatch(db);
        newFlavors.forEach((flavor, index) => batch.update(firestore.doc(db, "cardapio", grandParentId, "itens", parentId, "sabores", flavor.id), { posicao: index }));
        await batch.commit();
        toast.success("Ordem dos sabores salva!");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string; if (!name) return;
    setIsSaving(true);
    try {
      if (categoryModal.category) {
        await firestore.updateDoc(firestore.doc(db, "cardapio", categoryModal.category.id), { nomeCategoria: name });
        toast.success("Categoria atualizada!");
      } else {
        await firestore.addDoc(firestore.collection(db, "cardapio"), { nomeCategoria: name, posicao: categories.length });
        toast.success("Categoria criada!");
      }
      setCategoryModal({ open: false });
    } catch (error) { console.error("Error saving category:", error); toast.error("Erro ao salvar categoria."); }
    finally { setIsSaving(false); }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!db) return; if (!confirm("Tem certeza? Isso excluirá todos os itens e sabores dentro desta categoria.")) return;
    try {
      const itemsSnapshot = await firestore.getDocs(firestore.collection(db, "cardapio", categoryId, "itens"));
      const batch = firestore.writeBatch(db);
      for (const itemDoc of itemsSnapshot.docs) {
          const saboresSnapshot = await firestore.getDocs(firestore.collection(itemDoc.ref, "sabores"));
          saboresSnapshot.forEach(saborDoc => batch.delete(saborDoc.ref));
          batch.delete(itemDoc.ref);
      }
      batch.delete(firestore.doc(db, "cardapio", categoryId));
      await batch.commit();
      toast.success("Categoria excluída com sucesso!");
    } catch (error) { console.error("Error deleting category:", error); toast.error("Erro ao excluir categoria."); }
  };

  // **NOVA LÓGICA DE SALVAR ITEM (CORRIGIDA)**
  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (!db || !itemModal.categoryId || !itemModal.item) return;
    
    setIsSaving(true);
    let finalImageUrl = itemModal.item.imageUrl || '';

    // Upload da imagem (continua igual)
    if (imageFile) {
        try {
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(imageFile.name)}`, { method: 'POST', body: imageFile });
            if (!response.ok) throw new Error('Falha no upload do servidor.');
            const newBlob = await response.json();
            finalImageUrl = newBlob.url;
        } catch (error) {
            console.error('Erro no upload:', error);
            toast.error('Falha ao fazer upload da imagem.');
            setIsSaving(false);
            return;
        }
    }

    // **MUDANÇA PRINCIPAL: Lendo dados do estado, não do FormData**
    const itemData = {
      ...itemModal.item,
      imageUrl: finalImageUrl,
    };

    try {
      if (itemModal.item.id) {
        // Editando um item existente
        await firestore.updateDoc(firestore.doc(db, "cardapio", itemModal.categoryId, "itens", itemModal.item.id), itemData);
        toast.success("Item atualizado!");
      } else {
        // Adicionando um novo item
        const itemsColl = firestore.collection(db, "cardapio", itemModal.categoryId, "itens");
        await firestore.addDoc(itemsColl, { ...itemData, posicao: categories.find(c => c.id === itemModal.categoryId)?.items.length || 0 });
        toast.success("Item criado!");
      }
      setItemModal({ open: false });
      setImageFile(null);
    } catch (error) { console.error("Error saving item:", error); toast.error("Erro ao salvar o item."); }
    finally { setIsSaving(false); }
  };
  
  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!db) return; if (!confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      const itemRef = firestore.doc(db, "cardapio", categoryId, "itens", itemId);
      const saboresSnapshot = await firestore.getDocs(firestore.collection(itemRef, "sabores"));
      const batch = firestore.writeBatch(db);
      saboresSnapshot.forEach(doc => batch.delete(doc.ref));
      batch.delete(itemRef);
      await batch.commit();
      toast.success("Item excluído com sucesso!");
    } catch (error) { console.error("Error deleting item:", error); toast.error("Erro ao excluir item."); }
  };

  const handleManageFlavors = (categoryId: string, item: MenuItem) => {
    const sortedFlavors = item.sabores?.sort((a,b) => a.posicao - b.posicao) || [];
    setFlavorModal({ open: true, categoryId, itemId: item.id, itemNome: item.nomeItem, flavors: sortedFlavors });
  };
  
  const handleSaveFlavor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !flavorModal.categoryId || !flavorModal.itemId) return;
    const formData = new FormData(e.currentTarget);
    const flavorData = { nomeSabor: formData.get("nomeSabor") as string, disponivel: formData.get("disponivel") === "on" };
    if (!flavorData.nomeSabor) return;
    
    setIsSaving(true);
    const flavorCollectionRef = firestore.collection(db, "cardapio", flavorModal.categoryId, "itens", flavorModal.itemId, "sabores");
    try {
      if (currentFlavor) {
        await firestore.updateDoc(firestore.doc(flavorCollectionRef, currentFlavor.id), flavorData);
        toast.success("Sabor atualizado!");
      } else {
        const snapshot = await firestore.getDocs(flavorCollectionRef);
        await firestore.addDoc(flavorCollectionRef, { ...flavorData, posicao: snapshot.size });
        toast.success("Sabor adicionado!");
      }
      (e.target as HTMLFormElement).reset();
      setCurrentFlavor(null);
    } catch (error) { console.error("Error saving flavor", error); toast.error("Erro ao salvar sabor."); }
    finally { setIsSaving(false); }
  };
  
  const handleDeleteFlavor = async (flavorId: string) => {
    if (!db || !flavorModal.categoryId || !flavorModal.itemId) return;
    if (!confirm("Tem certeza que deseja excluir este sabor?")) return;
    try {
      await firestore.deleteDoc(firestore.doc(db, "cardapio", flavorModal.categoryId, "itens", flavorModal.itemId, "sabores", flavorId));
      setCurrentFlavor(null);
      toast.success("Sabor excluído!");
    } catch (error) { console.error("Error deleting flavor", error); toast.error("Erro ao excluir sabor."); }
  };
  
  // **NOVA FUNÇÃO para lidar com mudanças no formulário do item**
  const handleItemFormChange = (field: keyof MenuItem, value: string | boolean) => {
      setItemModal(prev => {
          if(!prev.item) return prev;
          return {
              ...prev,
              item: { ...prev.item, [field]: value }
          }
      });
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-slate-400 animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#4B4F36]">Gestão de Cardápio</h3>
        <Button onClick={() => setCategoryModal({ open: true })} className="bg-[#97A25F] hover:bg-[#97A25F]/90"><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'categories')}>
        <div className="space-y-6">
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onEditCategory={(cat: MenuCategory) => setCategoryModal({ open: true, category: cat })}
                onDeleteCategory={(catId: string) => handleDeleteCategory(catId)}
                onAddItem={(catId: string) => setItemModal({ open: true, categoryId: catId, item: { nomeItem: '', disponivel: true, posicao: category.items.length } })}
                onEditItem={(catId: string, item: MenuItem) => setItemModal({ open: true, categoryId: catId, item })}
                onDeleteItem={(catId: string, itemId: string) => handleDeleteItem(catId, itemId)}
                onItemsDragEnd={(e: DragEndEvent) => handleDragEnd(e, 'items', category.id)}
                onManageFlavors={(catId: string, item: MenuItem) => handleManageFlavors(catId, item)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* MODAL DE CATEGORIA */}
      <Dialog open={categoryModal.open} onOpenChange={(open) => setCategoryModal({ open })}><DialogContent><DialogHeader><DialogTitle>{categoryModal.category ? "Editar" : "Adicionar"} Categoria</DialogTitle><DialogDescription>Crie ou edite uma seção do seu cardápio, como "Pratos Quentes" ou "Bebidas".</DialogDescription></DialogHeader><form onSubmit={handleSaveCategory} className="space-y-4 pt-4"><div><Label htmlFor="name">Nome da Categoria</Label><Input id="name" name="name" defaultValue={categoryModal.category?.nomeCategoria || ""} required /></div><div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setCategoryModal({ open: false })}>Cancelar</Button><Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar"}</Button></div></form></DialogContent></Dialog>
      
      {/* MODAL DE ITEM (CORRIGIDO) */}
      <Dialog open={itemModal.open} onOpenChange={(open) => { if (!open) { setItemModal({ open: false }); setImageFile(null); } else { setItemModal(prev => ({...prev, open: true}))} }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemModal.item?.id ? "Editar" : "Adicionar"} Item</DialogTitle>
            <DialogDescription>Adicione ou edite um produto dentro de uma categoria.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
            <div><Label htmlFor="nomeItem">Nome do Item</Label><Input id="nomeItem" value={itemModal.item?.nomeItem || ""} onChange={e => handleItemFormChange('nomeItem', e.target.value)} required /></div>
            <div><Label htmlFor="descricaoPorcao">Descrição da Porção (opcional)</Label><Input id="descricaoPorcao" value={itemModal.item?.descricaoPorcao || ""} onChange={e => handleItemFormChange('descricaoPorcao', e.target.value)} /></div>
            <div><Label htmlFor="emoji">Emoji (opcional)</Label><Input id="emoji" value={itemModal.item?.emoji || ""} onChange={e => handleItemFormChange('emoji', e.target.value)} /></div>
            <div className="space-y-2">
              <Label htmlFor="imageFile">Imagem do Item</Label>
              {itemModal.item?.imageUrl && !imageFile && (<img src={itemModal.item.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-md"/>)}
              {imageFile && (<img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-24 h-24 object-cover rounded-md"/>)}
              <Input id="imageFile" type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]) }}} />
            </div>
            <div className="flex items-center space-x-2"><Checkbox id="disponivel" checked={itemModal.item?.disponivel ?? true} onCheckedChange={checked => handleItemFormChange('disponivel', Boolean(checked))} /><Label htmlFor="disponivel">Disponível para seleção</Label></div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setItemModal({ open: false }); setImageFile(null); }}>Cancelar</Button>
              <Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* MODAL DE SABORES */}
      <Dialog open={flavorModal.open} onOpenChange={(open) => { if (!open) { setFlavorModal({ open: false, flavors: [], categoryId: undefined, itemId: undefined, itemNome: undefined }); setCurrentFlavor(null); }}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Gerenciar Sabores: {flavorModal.itemNome}</DialogTitle><DialogDescription>Adicione, edite e reordene os sabores/preparos disponíveis.</DialogDescription></DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4"><h4 className="font-semibold text-lg border-b pb-2">{currentFlavor ? "Editar Sabor" : "Adicionar Novo Sabor"}</h4><form onSubmit={handleSaveFlavor} className="space-y-4" id="flavorForm"><div><Label htmlFor="nomeSabor">Nome do Sabor</Label><Input id="nomeSabor" name="nomeSabor" defaultValue={currentFlavor?.nomeSabor || ""} required /></div><div className="flex items-center space-x-2 pt-2"><input type="checkbox" id="disponivel" name="disponivel" defaultChecked={currentFlavor?.disponivel ?? true} className="w-4 h-4" /><Label htmlFor="disponivel">Disponível para seleção</Label></div><div className="flex gap-2 pt-2"><Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Salvar Sabor"}</Button>{currentFlavor && <Button type="button" variant="ghost" onClick={() => { setCurrentFlavor(null); (document.getElementById('flavorForm') as HTMLFormElement)?.reset(); }}>Cancelar Edição</Button>}</div></form></div>
            <div className="space-y-3"><h4 className="font-semibold text-lg border-b pb-2">Sabores Existentes</h4>
              <DndContext sensors={sensors} onDragEnd={(e) => handleDragEnd(e, 'flavors', flavorModal.itemId, flavorModal.categoryId)}>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    <SortableContext items={flavorModal.flavors.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      {flavorModal.flavors.map(flavor => <SortableFlavorItem key={flavor.id} flavor={flavor} onEdit={() => setCurrentFlavor(flavor)} onDelete={() => handleDeleteFlavor(flavor.id)} />)}
                    </SortableContext>
                  </div>
              </DndContext>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}