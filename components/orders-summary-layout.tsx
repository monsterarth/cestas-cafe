// Arquivo: components/orders-summary-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { useMemo } from 'react';
import { OrderReceiptLayout } from './order-receipt-layout';

interface OrdersSummaryLayoutProps {
  orders: Order[];
  config: AppConfig | null;
}

const aggregateAllItems = (orders: Order[]) => {
    const allItems = orders.flatMap(order => order.itensPedido || []);
    
    const itemMap = allItems.reduce((acc, item) => {
        const key = `${item.nomeItem}-${item.sabor || ''}`;
        if (!acc[key]) {
            acc[key] = { ...item, quantidade: 0, fromOrders: new Set<string>() };
        }
        acc[key].quantidade += item.quantidade;
        
        // ESTA É A LINHA CORRIGIDA
        const orderOfItem = orders.find(o => o.itensPedido.includes(item));
        
        if (orderOfItem) {
           acc[key].fromOrders.add(`Cabana ${orderOfItem.cabanaNumero}`);
        }
        return acc;
    }, {} as Record<string, ItemPedido & { fromOrders: Set<string> }>);
    
    const aggregatedItems = Object.values(itemMap);

    const pratosQuentes = aggregatedItems.filter(i => i.categoria?.toLowerCase().includes('pratos quentes'));
    const bebidas = aggregatedItems.filter(i => i.categoria?.toLowerCase().includes('bebidas'));
    const paes = aggregatedItems.filter(i => i.categoria?.toLowerCase().includes('pães'));
    const acompanhamentos = aggregatedItems.filter(i => i.categoria?.toLowerCase().includes('acompanhamentos'));
    const outros = aggregatedItems.filter(i => 
        !i.categoria?.toLowerCase().includes('pratos quentes') &&
        !i.categoria?.toLowerCase().includes('bebidas') &&
        !i.categoria?.toLowerCase().includes('pães') &&
        !i.categoria?.toLowerCase().includes('acompanhamentos')
    );

    return { pratosQuentes, bebidas, paes, acompanhamentos, outros };
};

export const OrdersSummaryLayout = ({ orders, config }: OrdersSummaryLayoutProps) => {
  const { pratosQuentes, bebidas, paes, acompanhamentos, outros } = useMemo(() => aggregateAllItems(orders), [orders]);
  
  const motivationalMessage = useMemo(() => {
      const messages = config?.mensagensMotivacionais;
      if (!messages || messages.length === 0) return "Bom trabalho, equipe!";
      return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

  const ItemSection = ({ title, items }: { title: string, items: (ItemPedido & { fromOrders: Set<string> })[]}) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-2">
            <p className="font-bold uppercase text-xs border-b border-black pb-1">{title}</p>
            {items.map((item, index) => (
                <p key={index} className="text-xs pl-2">
                    {item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}
                    <span className="text-gray-500 text-[10px] block pl-2">↳ {Array.from(item.fromOrders).join(', ')}</span>
                </p>
            ))}
        </div>
      );
  };

  return (
    <div className="p-2 font-sans bg-white text-black" style={{ width: '80mm' }}>
      <div className="text-center">
        <h1 className="font-bold text-lg">RESUMO DA COZINHA</h1>
        <p className="text-xs">{new Date().toLocaleDateString('pt-BR')} - {orders.length} pedidos pendentes</p>
        <p className="text-xs italic p-2 bg-gray-100 my-2 rounded">"{motivationalMessage}"</p>
      </div>

      <div className="my-2">
        <ItemSection title="Pratos Quentes" items={pratosQuentes} />
        <ItemSection title="Bebidas" items={bebidas} />
        <ItemSection title="Pães" items={paes} />
        <ItemSection title="Acompanhamentos" items={acompanhamentos} />
        <ItemSection title="Outros" items={outros} />
      </div>

      <div className="border-t-4 border-double border-black my-4"></div>

      <div className="text-center mb-2">
        <h2 className="font-bold text-lg">COMANDAS INDIVIDUAIS</h2>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
            <div key={order.id} className="border-2 border-dashed border-gray-300 p-1" style={{ pageBreakBefore: 'always' }}>
                <OrderReceiptLayout order={order} />
            </div>
        ))}
      </div>
    </div>
  );
};