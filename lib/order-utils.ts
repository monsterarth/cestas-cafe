// lib/order-utils.ts
import { ItemPedido } from "@/types";

// CORREÇÃO: Usando "Bebidas" e incluindo todas as suas categorias na ordem correta.
export const CATEGORY_ORDER = [
  'Pratos Quentes', 
  'Bebidas', 
  'Pães', 
  'Bolos', 
  'Frutas', 
  'Frios', 
  'Acompanhamentos'
];

/**
 * Agrupa uma lista de itens de pedido pela categoria definida em CATEGORY_ORDER.
 */
export const groupItemsByCategory = (items: ItemPedido[]): Map<string, ItemPedido[]> => {
  const categoryMap = new Map<string, ItemPedido[]>();

  const allCategories = [...CATEGORY_ORDER, 'Outros'];
  allCategories.forEach(cat => {
    categoryMap.set(cat, []);
  });

  items.forEach(item => {
    const itemCategory = item.categoria || 'Outros';
    const category = allCategories.includes(itemCategory) ? itemCategory : 'Outros';
    categoryMap.get(category)!.push(item);
  });

  return categoryMap;
};