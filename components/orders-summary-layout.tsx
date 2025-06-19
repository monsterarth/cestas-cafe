// Arquivo: components/orders-summary-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { useMemo } from 'react';
import { OrderReceiptLayout } from './order-receipt-layout';

interface OrdersSummaryLayoutProps {
  orders: Order[];
  config: AppConfig | null;
}

// --- Nova Lógica de Processamento de Dados ---
const processOrdersForSummary = (orders: Order[]) => {
  // 1. Resumo dos Horários de Entrega
  const deliveryTimeSummary = orders.reduce((acc, order) => {
    const time = order.horarioEntrega;
    acc[time] = (acc[time] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allItems = orders.flatMap(order => order.itensPedido || []);

  // 2. Resumo dos Pratos Quentes (agrupando por item e depois por sabor)
  const hotDishes = allItems.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
  const hotDishesSummary = hotDishes.reduce((acc, item) => {
    if (!acc[item.nomeItem]) {
      acc[item.nomeItem] = { total: 0, flavors: {} };
    }
    acc[item.nomeItem].total += item.quantidade;
    if (item.sabor) {
      acc[item.nomeItem].flavors[item.sabor] = (acc[item.nomeItem].flavors[item.sabor] || 0) + item.quantidade;
    }
    return acc;
  }, {} as Record<string, { total: number; flavors: Record<string, number> }>);

  // 3. Resumo de outras categorias (agrupando apenas por item)
  const otherItems = allItems.filter(item => !item.categoria?.toLowerCase().includes('pratos quentes'));
  const otherItemsSummary = otherItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) {
      acc[category] = {};
    }
    acc[category][item.nomeItem] = (acc[category][item.nomeItem] || 0) + item.quantidade;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return {
    totalBaskets: orders.length,
    deliveryTimeSummary,
    hotDishesSummary,
    otherItemsSummary,
  };
};

export const OrdersSummaryLayout = ({ orders, config }: OrdersSummaryLayoutProps) => {
  const { 
    totalBaskets, 
    deliveryTimeSummary, 
    hotDishesSummary, 
    otherItemsSummary 
  } = useMemo(() => processOrdersForSummary(orders), [orders]);
  
  const motivationalMessage = useMemo(() => {
    const messages = config?.mensagensMotivacionais;
    if (!messages || messages.length === 0) return "Bom trabalho, equipe!";
    return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

  // Formata a data atual para o cabeçalho
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-2 font-sans bg-white text-black text-sm" style={{ width: '80mm' }}>
      {/* SEÇÃO 1: CABEÇALHO E RESUMO DE ENTREGAS */}
      <div className="text-center mb-2">
        <h1 className="font-bold text-base">Pedidos de hoje ({currentDate})</h1>
      </div>
      <div className="text-xs p-2 border border-black rounded">
        <p className="font-bold">Número de Cestas: {totalBaskets}</p>
        <div className="border-t border-dashed border-black my-1"></div>
        {Object.entries(deliveryTimeSummary).map(([time, count]) => (
          <p key={time}>{time}: {count} cesta(s)</p>
        ))}
      </div>
      <p className="text-xs italic text-center p-2 my-2">"{motivationalMessage}"</p>
      <div className="border-t-2 border-black"></div>

      {/* SEÇÃO 2: RESUMO DE ITENS AGRUPADOS */}
      <div className="my-2 space-y-3">
        {/* Pratos Quentes com Sabores */}
        {Object.keys(hotDishesSummary).length > 0 && (
          <div>
            <p className="font-bold uppercase text-xs">PRATOS QUENTES:</p>
            {Object.entries(hotDishesSummary).map(([itemName, summary]) => (
              <div key={itemName} className="pl-2">
                <p className="font-semibold text-xs mt-1">{summary.total} {itemName}:</p>
                {Object.entries(summary.flavors).map(([flavorName, flavorCount]) => (
                  <p key={flavorName} className="pl-4 text-xs">- {flavorCount} {flavorName.toLowerCase()}</p>
                ))}
              </div>
            ))}
            <div className="border-t border-dashed border-black mt-2"></div>
          </div>
        )}
        
        {/* Outras Categorias */}
        {Object.entries(otherItemsSummary).map(([categoryName, items]) => (
            <div key={categoryName}>
                <p className="font-bold uppercase text-xs">{categoryName}:</p>
                {Object.entries(items).map(([itemName, quantity]) => (
                    <p key={itemName} className="pl-2 text-xs">- {itemName}: {quantity} porções</p>
                ))}
                <div className="border-t border-dashed border-black mt-2"></div>
            </div>
        ))}
      </div>
      
      {/* FIM DA PÁGINA DE RESUMO */}
      <p className="text-center text-xs font-bold py-2">--- Fim do Resumo ---</p>

      {/* SEÇÃO 3: COMANDAS INDIVIDUAIS (Começam em uma nova página) */}
      <div style={{ pageBreakBefore: 'always' }}>
        <div className="text-center mb-2">
          <h2 className="font-bold text-lg">COMANDAS INDIVIDUAIS</h2>
        </div>
        <div className="space-y-4">
          {orders.map(order => (
              <div key={order.id} className="border-2 border-dashed border-gray-300 p-1" style={{ pageBreakInside: 'avoid' }}>
                  <OrderReceiptLayout order={order} />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};