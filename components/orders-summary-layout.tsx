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

// SIMPLIFICADO: Não usa mais React.forwardRef
export const OrdersSummaryLayout = ({ summary, totalOrders }: OrdersSummaryLayoutProps) => {
  return (
    <div className="p-10 font-sans bg-white text-black">
      {/* ... todo o seu layout de resumo aqui ... */}
    </div>
  );
};