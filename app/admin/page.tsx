// Arquivo: app/admin/menu/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from "react";
import * as firestore from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Edit, Trash2, Sandwich, Loader2, Upload } from "lucide-react";
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
function SortableItem({ item, isHotDish, ...props }: { item: MenuItem; isHotDish: boolean; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className="border-b bg-white hover:bg-muted/50">
      <td className="p-3 w-10"><GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} /></td>
      <td className="p-3">
        <div className="flex items-center gap-4">
          {item.imageUrl ? <img src={item.imageUrl} alt={item.nomeItem} className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">?</div>}
          <span className="font-medium text-[#4B4F36]">{item.nomeItem}</span>
        </div>
      </td>
      <td className="p-3">
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${item.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {item.disponivel ? "Disponível" : "Indisponível"}
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
    <div ref={setNodeRef} style={style} className="bg-card rounded-xl shadow-sm border mb-6">
      <div className="p-4 border-b flex justify-between items-center bg-muted/50 rounded-t-xl">
        <div className="flex items-center gap-4">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" {...attributes} {...listeners} />
          <h4 className="text-lg font-semibold text-card-foreground">{category.nomeCategoria}</h4>
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


export default function MenuPage() {
    // ... (rest of the file)
}