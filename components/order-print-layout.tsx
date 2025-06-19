import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintLayoutProps {
  order: Order;
}

// SIMPLIFICADO: Não usa mais React.forwardRef
export const OrderPrintLayout = ({ order }: OrderPrintLayoutProps) => {
  const allItems = order.itensPedido || [];
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div className="p-10 font-sans bg-white text-black">
      {/* O conteúdo interno continua o mesmo */}
    </div>
  );
};