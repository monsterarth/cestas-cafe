import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintLayoutProps {
  order: Order;
}

// CORREÇÃO: React.forwardRef RESTAURADO
export const OrderPrintLayout = React.forwardRef<HTMLDivElement, OrderPrintLayoutProps>(({ order }, ref) => {
  const allItems = order.itensPedido || [];
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div ref={ref} className="p-10 font-sans bg-white text-black">
      {/* ... conteúdo interno sem alterações ... */}
    </div>
  );
});

OrderPrintLayout.displayName = 'OrderPrintLayout';