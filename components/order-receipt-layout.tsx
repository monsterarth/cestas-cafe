import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderReceiptLayoutProps {
  order: Order;
}

// CORREÇÃO: React.forwardRef RESTAURADO
export const OrderReceiptLayout = React.forwardRef<HTMLDivElement, OrderReceiptLayoutProps>(({ order }, ref) => {
  const allItems = order.itensPedido || [];
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div ref={ref} className="p-1 font-mono text-xs bg-white text-black" style={{ width: '80mm' }}>
        {/* ... conteúdo interno sem alterações ... */}
    </div>
  );
});

OrderReceiptLayout.displayName = 'OrderReceiptLayout';