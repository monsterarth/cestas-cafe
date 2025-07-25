// components/orders-summary-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { useMemo } from 'react';
import { OrderReceiptLayout } from './order-receipt-layout';
import { CATEGORY_ORDER } from '@/lib/order-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone } from 'lucide-react';

interface OrdersSummaryLayoutProps {
  orders: Order[];
  config: AppConfig | null;
}

const processOrdersForSummary = (orders: Order[]) => {
  const deliveryTimeSummary: Record<string, number> = {};
  const aggregatedItems = new Map<string, Map<string, number>>();
  const generalObservations: { guestName: string, text: string }[] = [];
  const hotDishObservations: { guestName: string, text: string }[] = [];
  
  const allCategories = [...CATEGORY_ORDER, 'Outros'];
  allCategories.forEach(cat => aggregatedItems.set(cat, new Map()));

  orders.forEach(order => {
    deliveryTimeSummary[order.horarioEntrega] = (deliveryTimeSummary[order.horarioEntrega] || 0) + 1;
    if (order.observacoesGerais) generalObservations.push({ guestName: order.hospedeNome, text: order.observacoesGerais });
    if (order.observacoesPratosQuentes) hotDishObservations.push({ guestName: order.hospedeNome, text: order.observacoesPratosQuentes });

    order.itensPedido?.forEach(item => {
      let itemCategory = item.categoria || 'Outros';
      if (itemCategory.toLowerCase().includes('bebidas')) itemCategory = 'Sucos';
      const category = allCategories.includes(itemCategory) ? itemCategory : 'Outros';
      
      const key = category === 'Pratos Quentes' && item.sabor ? `${item.nomeItem} (${item.sabor})` : item.nomeItem;
      const categoryMap = aggregatedItems.get(category)!;
      categoryMap.set(key, (categoryMap.get(key) || 0) + item.quantidade);
    });
  });

  return { totalBaskets: orders.length, deliveryTimeSummary, aggregatedItems, generalObservations, hotDishObservations };
};

export const OrdersSummaryLayout = ({ orders, config }: OrdersSummaryLayoutProps) => {
  const { totalBaskets, deliveryTimeSummary, aggregatedItems, generalObservations, hotDishObservations } = useMemo(() => processOrdersForSummary(orders), [orders]);
  
  const motivationalMessage = useMemo(() => {
    const messages = config?.mensagensMotivacionais;
    if (!messages || messages.length === 0) return "Bom trabalho, equipe!";
    return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

  const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const ItemListWithCheckbox = ({ items }: { items: [string, number][] }) => (
    items.sort().map(([itemName, quantity]) => (
      <div key={itemName} className="flex items-center text-sm mb-1">
        <div className="w-5 h-5 border-2 border-gray-400 rounded-sm mr-3 flex-shrink-0"></div>
        <span>{quantity}x {itemName}</span>
      </div>
    ))
  );

  return (
    <div className="p-8 font-sans bg-white text-black text-sm">
      {/* CORREÇÃO: Cabeçalho totalmente refeito para ser compacto */}
      <header className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
        <div>
          <h1 className="font-bold text-2xl">Resumo de Produção da Cozinha</h1>
          <p className="text-lg text-gray-600">Data: {currentDate}</p>
          <p className="text-xs italic text-gray-500 mt-2">"{motivationalMessage}"</p>
        </div>
        <div className="text-right border p-3 rounded-lg bg-gray-50">
          <p className="font-bold text-base">
            Total de Pedidos: <span className="font-normal text-lg">{totalBaskets}</span>
          </p>
          <div className="text-xs mt-1">
            <span className="font-bold">Horários: </span>
            <span>
              {Object.entries(deliveryTimeSummary).sort().map(([time, count]) => `${time}h (${count})`).join(' / ')}
            </span>
          </div>
        </div>
      </header>
      
      {(generalObservations.length > 0 || hotDishObservations.length > 0) && (
        <div className="mb-8"><Alert variant="destructive"><Megaphone className="h-4 w-4" /><AlertTitle className="font-bold text-lg">ATENÇÃO: OBSERVAÇÕES IMPORTANTES!</AlertTitle><AlertDescription className="space-y-2 mt-2">{generalObservations.map((obs, i) => <p key={`g-${i}`}><strong>Geral ({obs.guestName}):</strong> {obs.text}</p>)}{hotDishObservations.map((obs, i) => <p key={`h-${i}`}><strong>Pratos Quentes ({obs.guestName}):</strong> {obs.text}</p>)}</AlertDescription></Alert></div>
      )}
      
      <h2 className="font-bold text-xl mb-4 text-center">Itens Agrupados para Preparo</h2>
      
      <div className="grid grid-cols-2 gap-x-8">
        {[...CATEGORY_ORDER, 'Outros'].map(categoryName => {
            const items = aggregatedItems.get(categoryName);
            if (!items || items.size === 0) return null;
            return (
              <div key={categoryName} className="break-inside-avoid mb-4">
                <p className="font-bold uppercase text-base border-b-2 border-gray-300 pb-1 mb-2">{categoryName}</p>
                <ItemListWithCheckbox items={Array.from(items.entries())} />
              </div>
            );
        })}
      </div>
      
      <div style={{ pageBreakBefore: 'always' }}>
        <div className="text-center mb-4 pt-4"><h2 className="font-bold text-2xl">Comandas Individuais</h2></div>
        <div className="grid grid-cols-2 gap-2">{orders.map(order => (<div key={order.id} className="border-2 border-dashed border-gray-300 p-1" style={{ pageBreakInside: 'avoid' }}><OrderReceiptLayout order={order} /></div>))}</div>
      </div>
    </div>
  );
};