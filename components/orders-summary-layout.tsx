// Arquivo: components/orders-summary-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { useMemo } from 'react';
import { OrderReceiptLayout } from './order-receipt-layout';

interface OrdersSummaryLayoutProps {
  orders: Order[];
  config: AppConfig | null;
}

// A lógica de processamento de dados permanece a mesma
const processOrdersForSummary = (orders: Order[]) => {
  const deliveryTimeSummary = orders.reduce((acc, order) => {
    const time = order.horarioEntrega;
    acc[time] = (acc[time] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allItems = orders.flatMap(order => order.itensPedido || []);

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

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    // CORREÇÃO: Removido o style de largura fixa e adicionado padding maior
    <div className="p-8 font-sans bg-white text-black text-sm">
      {/* SEÇÃO 1: CABEÇALHO */}
      <div className="text-center mb-6 pb-4 border-b-2 border-black">
        <h1 className="font-bold text-2xl">Resumo de Produção da Cozinha</h1>
        <p className="text-lg">Pedidos de hoje ({currentDate})</p>
      </div>

      {/* SEÇÃO 2: RESUMO DE ENTREGAS E MENSAGEM (EM COLUNAS) */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-bold text-base mb-2">Resumo de Cestas</h2>
            <p className="font-semibold">Número Total de Cestas: {totalBaskets}</p>
            <div className="border-t border-dashed my-2"></div>
            <p className="font-bold mb-1">Entregas por Horário:</p>
            {Object.entries(deliveryTimeSummary).map(([time, count]) => (
              <p key={time} className="text-sm pl-2">{time}: {count} cesta(s)</p>
            ))}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center p-4">
           <p className="text-base italic text-yellow-800 text-center">"{motivationalMessage}"</p>
        </div>
      </div>
      
      <div className="border-t-2 border-black mb-6"></div>

      {/* SEÇÃO 3: RESUMO DE ITENS AGRUPADOS (EM COLUNAS) */}
      <h2 className="font-bold text-xl mb-4 text-center">Itens Agrupados para Preparo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Pratos Quentes com Sabores */}
        {Object.keys(hotDishesSummary).length > 0 && (
          <div className="break-inside-avoid">
            <p className="font-bold uppercase text-base border-b-2 border-gray-300 pb-1 mb-2">PRATOS QUENTES</p>
            {Object.entries(hotDishesSummary).map(([itemName, summary]) => (
              <div key={itemName} className="pl-2 mb-2">
                <p className="font-semibold text-sm mt-1">{summary.total} {itemName}:</p>
                {Object.entries(summary.flavors).map(([flavorName, flavorCount]) => (
                  <p key={flavorName} className="pl-4 text-sm">- {flavorCount} {flavorName.toLowerCase()}</p>
                ))}
              </div>
            ))}
          </div>
        )}
        
        {/* Outras Categorias */}
        {Object.entries(otherItemsSummary).map(([categoryName, items]) => (
            <div key={categoryName} className="break-inside-avoid">
                <p className="font-bold uppercase text-base border-b-2 border-gray-300 pb-1 mb-2">{categoryName}</p>
                {Object.entries(items).map(([itemName, quantity]) => (
                    <p key={itemName} className="pl-2 text-sm">- {itemName}: {quantity} porções</p>
                ))}
            </div>
        ))}
      </div>
      
      {/* SEÇÃO 4: COMANDAS INDIVIDUAIS (Começam em uma nova página) */}
      <div style={{ pageBreakBefore: 'always' }}>
        <div className="text-center mb-4 pt-4">
          <h2 className="font-bold text-2xl">Comandas Individuais</h2>
        </div>
        <div className="space-y-4">
          {orders.map(order => (
              <div key={order.id} className="border-2 border-dashed border-gray-300 p-1" style={{ pageBreakInside: 'avoid' }}>
                  {/* O OrderReceiptLayout mantém seu próprio estilo de 80mm */}
                  <OrderReceiptLayout order={order} />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};