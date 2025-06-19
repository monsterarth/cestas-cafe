import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SummaryData {
  [category: string]: {
    [itemName: string]: number;
  };
}

interface OrdersSummaryLayoutProps {
  summary: SummaryData;
  totalOrders: number;
}

// Removido React.forwardRef
export const OrdersSummaryLayout = ({ summary, totalOrders }: OrdersSummaryLayoutProps) => {
  return (
    // Removida a 'ref' da div
    <div className="p-10 font-sans bg-white text-black">
      <header className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold">Resumo da Cozinha</h1>
        <p className="text-lg">Total de Pedidos Pendentes: {totalOrders}</p>
        <p className="text-sm text-gray-600">Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </header>
      
      <div className="space-y-6">
        {Object.entries(summary).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-2xl font-semibold mb-3 border-b-2 border-gray-300 pb-2 uppercase">{category}</h2>
            <table className="w-full text-left">
              <tbody>
                {Object.entries(items).map(([itemName, quantity]) => (
                  <tr key={itemName} className="border-b">
                    <td className="py-2 text-lg">{itemName}</td>
                    <td className="py-2 text-lg font-bold text-right">{quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
};