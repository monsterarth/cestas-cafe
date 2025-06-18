"use client"

import { useState, useEffect, useMemo } from "react"
import * as firestore from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Edit, Trash2 } from "lucide-react"

interface MenuItem {
  id: string
  nomeItem: string
  emoji?: string
  disponivel: boolean
  descricaoPorcao?: string
  imageUrl?: string
  posicao: number
}

interface MenuCategory {
  id: string
  nomeCategoria: string
  posicao: number
  items: MenuItem[]
}

// Componente para um Item arrastável
function SortableItem({
  item,
  onEditItem,
  onDeleteItem,
}: {
  item: MenuItem
  onEditItem: () => void
  onDeleteItem: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr ref={setNodeRef} style={style} className="border-b bg-white">
      <td className="p-3 w-10">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
      </td>
      <td className="p-3">
        <span className="font-medium text-[#4B4F36]">{item.nomeItem}</span>
      </td>
      <td className="p-3">
        <span
          className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
            item.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {item.disponivel ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="p-3 text-right">
        <Button variant="ghost" size="sm" onClick={onEditItem}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDeleteItem}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  )
}

// Componente para uma Categoria arrastável
function SortableCategory({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onItemsDragEnd,
}: {
  category: MenuCategory
  onEditCategory: (category: MenuCategory) => void
  onDeleteCategory: (categoryId: string) => void
  onAddItem: (categoryId: string) => void
  onEditItem: (categoryId: string, item: MenuItem) => void
  onDeleteItem: (categoryId: string, itemId: string) => void
  onItemsDragEnd: (event: DragEndEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const itemIds = useMemo(() => category.items.map((item) => item.id), [category.items])

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-[#ADA192]">
      <div className="p-4 border-b border-[#ADA192] flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-4">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
          <h4 className="text-lg font-semibold text-[#4B4F36]">{category.nomeCategoria}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onAddItem(category.id)}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Item
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCategory(category)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteCategory(category.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-2">
        <table className="w-full">
          <DndContext sensors={useSensors(useSensor(PointerSensor))} onDragEnd={onItemsDragEnd} collisionDetection={closestCenter}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <tbody>
                {category.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onEditItem={() => onEditItem(category.id, item)}
                    onDeleteItem={() => onDeleteItem(category.id, item.id)}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
    </div>
  )
}

// Página principal do Menu
export default function MenuPage() {
  const [db, setDb] = useState<firestore.Firestore | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: MenuCategory }>({ open: false })
  const [itemModal, setItemModal] = useState<{ open: boolean; categoryId?: string; item?: MenuItem }>({ open: false })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    // ... (restante do seu useEffect para carregar os dados)
    const initializeDbAndListener = async () => {
      const firestoreDb = await getFirebaseDb()
      if (firestoreDb) {
        setDb(firestoreDb)
        const menuQuery = firestore.query(firestore.collection(firestoreDb, "cardapio"), firestore.orderBy("posicao"))
        const unsubscribe = firestore.onSnapshot(
          menuQuery,
          async (snapshot) => {
            const categoriesData: MenuCategory[] = []
            for (const categoryDoc of snapshot.docs) {
              const categoryData = categoryDoc.data()
              const itemsQuery = firestore.query(
                firestore.collection(firestoreDb, "cardapio", categoryDoc.id, "itens"),
                firestore.orderBy("posicao"),
              )
              const itemsSnapshot = await firestore.getDocs(itemsQuery)
              const items: MenuItem[] = itemsSnapshot.docs.map((itemDoc) => ({
                id: itemDoc.id,
                ...itemDoc.data(),
              })) as MenuItem[]
              categoriesData.push({
                id: categoryDoc.id,
                nomeCategoria: categoryData.nomeCategoria,
                posicao: categoryData.posicao,
                items,
              })
            }
            setCategories(categoriesData)
            setLoading(false)
          },
          (error) => {
            console.error("Error loading menu:", error)
            setLoading(false)
          },
        )
        return unsubscribe
      } else {
        console.error("Firestore is not available.")
        setLoading(false)
      }
    }
    let unsubscribe: (() => void) | undefined
    initializeDbAndListener().then((unsub) => {
      if (unsub) unsubscribe = unsub
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!db) return
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
        // Reordenando Categorias
        const oldIndex = categories.findIndex((cat) => cat.id === active.id)
        const newIndex = categories.findIndex((cat) => cat.id === over.id)
        
        if (oldIndex === -1 || newIndex === -1) return // Sai se não for uma categoria

        const newCategories = arrayMove(categories, oldIndex, newIndex)
        setCategories(newCategories)

        const batch = firestore.writeBatch(db)
        newCategories.forEach((category, index) => {
          batch.update(firestore.doc(db, "cardapio", category.id), { posicao: index })
        })
        await batch.commit()
    }
  }
  
  const handleItemDragEnd = async (event: DragEndEvent) => {
      if (!db) return
      const { active, over } = event
      
      if(over && active.id !== over.id) {
          const category = categories.find(cat => cat.items.some(item => item.id === active.id))
          if(!category) return

          const oldIndex = category.items.findIndex(item => item.id === active.id)
          const newIndex = category.items.findIndex(item => item.id === over.id)

          if(oldIndex === -1 || newIndex === -1) return;

          const newItems = arrayMove(category.items, oldIndex, newIndex)
          const newCategories = categories.map(cat => 
              cat.id === category.id ? {...cat, items: newItems} : cat
          )
          setCategories(newCategories)

          const batch = firestore.writeBatch(db)
          newItems.forEach((item, index) => {
              const itemRef = firestore.doc(db, "cardapio", category.id, "itens", item.id)
              batch.update(itemRef, { posicao: index })
          })
          await batch.commit()
      }
  }

  // ... (restante do seu código: handleSaveCategory, handleDeleteCategory, handleSaveItem, handleDeleteItem)
  const handleSaveCategory = async (formData: FormData) => {
    if (!db) return
    const name = formData.get("name") as string
    if (!name) return
    try {
      if (categoryModal.category) {
        await firestore.updateDoc(firestore.doc(db, "cardapio", categoryModal.category.id), { nomeCategoria: name })
      } else {
        await firestore.addDoc(firestore.collection(db, "cardapio"), { nomeCategoria: name, posicao: categories.length })
      }
      setCategoryModal({ open: false })
    } catch (error) { console.error("Error saving category:", error) }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!db) return
    if (!confirm("Tem certeza que deseja excluir esta categoria e todos os itens?")) return
    try {
      const batch = firestore.writeBatch(db)
      const itemsSnapshot = await firestore.getDocs(firestore.collection(db, "cardapio", categoryId, "itens"))
      itemsSnapshot.docs.forEach((itemDoc) => { batch.delete(itemDoc.ref) })
      batch.delete(firestore.doc(db, "cardapio", categoryId))
      await batch.commit()
    } catch (error) { console.error("Error deleting category:", error) }
  }

  const handleSaveItem = async (formData: FormData) => {
    if (!db) return
    const categoryId = itemModal.categoryId
    if (!categoryId) return
    const itemData = {
      nomeItem: formData.get("nomeItem") as string,
      emoji: formData.get("emoji") as string,
      disponivel: formData.get("disponivel") === "on",
      descricaoPorcao: formData.get("descricaoPorcao") as string,
      imageUrl: formData.get("imageUrl") as string,
    }
    try {
      if (itemModal.item) {
        await firestore.updateDoc(firestore.doc(db, "cardapio", categoryId, "itens", itemModal.item.id), itemData)
      } else {
        const itemsSnapshot = await firestore.getDocs(firestore.collection(db, "cardapio", categoryId, "itens"))
        await firestore.addDoc(firestore.collection(db, "cardapio", categoryId, "itens"), { ...itemData, posicao: itemsSnapshot.size })
      }
      setItemModal({ open: false })
    } catch (error) { console.error("Error saving item:", error) }
  }

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!db) return
    if (!confirm("Tem certeza que deseja excluir este item?")) return
    try {
      await firestore.deleteDoc(firestore.doc(db, "cardapio", categoryId, "itens", itemId))
    } catch (error) { console.error("Error deleting item:", error) }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-[#4B4F36]">Gestão de Cardápio</h3>
          <p className="text-[#ADA192] mt-1">Arraste para reordenar. As mudanças são salvas automaticamente.</p>
        </div>
        <Button onClick={() => setCategoryModal({ open: true })} className="bg-[#97A25F] hover:bg-[#97A25F]/90">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onEditCategory={(cat) => setCategoryModal({ open: true, category: cat })}
                onDeleteCategory={handleDeleteCategory}
                onAddItem={(catId) => setItemModal({ open: true, categoryId: catId })}
                onEditItem={(catId, item) => setItemModal({ open: true, categoryId: catId, item })}
                onDeleteItem={handleDeleteItem}
                onItemsDragEnd={handleItemDragEnd}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Category Modal */}
      <Dialog open={categoryModal.open} onOpenChange={(open) => setCategoryModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryModal.category ? "Editar" : "Adicionar"} Categoria</DialogTitle>
          </DialogHeader>
          <form action={handleSaveCategory} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input id="name" name="name" defaultValue={categoryModal.category?.nomeCategoria || ""} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCategoryModal({ open: false })}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90"> Salvar </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Modal */}
      <Dialog open={itemModal.open} onOpenChange={(open) => setItemModal({ open })}>
        <DialogContent className="max-w-2xl bg-background/90 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>{itemModal.item ? "Editar" : "Adicionar"} Item</DialogTitle>
          </DialogHeader>
          <form action={handleSaveItem} className="space-y-4">
            <div>
              <Label htmlFor="nomeItem">Nome do Item</Label>
              <Input id="nomeItem" name="nomeItem" defaultValue={itemModal.item?.nomeItem || ""} required />
            </div>
            <div>
              <Label htmlFor="descricaoPorcao">Descrição da Porção</Label>
              <Input id="descricaoPorcao" name="descricaoPorcao" defaultValue={itemModal.item?.descricaoPorcao || ""} />
            </div>
            <div>
              <Label htmlFor="emoji">Emoji</Label>
              <Input id="emoji" name="emoji" defaultValue={itemModal.item?.emoji || ""} />
            </div>
            <div>
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input id="imageUrl" name="imageUrl" defaultValue={itemModal.item?.imageUrl || ""} placeholder="https://exemplo.com/imagem.jpg" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="disponivel" name="disponivel" defaultChecked={itemModal.item?.disponivel ?? true} className="rounded" />
              <Label htmlFor="disponivel">Disponível</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setItemModal({ open: false })}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#97A25F] hover:bg-[#97A25F]/90"> Salvar </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}