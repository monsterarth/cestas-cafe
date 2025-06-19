import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SummaryData {
  [category: string]: { [itemName: string]: number; };
}
interface OrdersSummaryLayoutProps {
  summary: SummaryData;
  totalOrders: number;
}

// CORREÇÃO: React.forwardRef RESTAURADO
export const OrdersSummaryLayout = React.forwardRef<HTMLDivElement, OrdersSummaryLayoutProps>(({ summary, totalOrders }, ref) => {
  return (
    <div ref={ref} className="p-10 font-sans bg-white text-black">
        {/* ... conteúdo interno sem alterações ... */}
    </div>
  );
});

OrdersSummaryLayout.displayName = 'OrdersSummaryLayout';