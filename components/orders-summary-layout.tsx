import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Order } from '@/types';

// O tipo para a estrutura de dados agregada
interface AggregatedSummary {
  [category: string]: {
    [itemName: string]: {
      total: number;
      sabores: Record<string, number>;
    };
  };
}

interface OrdersSummaryLayoutProps {
  summary: AggregatedSummary;
  pendingOrders: Order[];
}

export const OrdersSummaryLayout = ({ summary, pendingOrders }: OrdersSummaryLayoutProps) => {
  return (
    <div className="p-8 font-sans bg-white text-black">
      <header className="text-center border-b-2 border-black pb-4 mb-8">
        <h1 className="text-3xl font-bold">Resumo da Cozinha</h1>
        <p className="text-lg">Total de Pedidos Pendentes: {pendingOrders.length}</p>
        <p className="text-sm text-gray-600">Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </header>
      
      {/* SEÇÃO 1: RESUMO DE PRODUÇÃO */}
      <section className="mb-10 page-break-after">
        <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2">RESUMO DE PRODUÇÃO</h2>
        <div className="space-y-6">
          {Object.entries(summary).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold uppercase text-gray-800">{category}</h3>
              <div className="pl-4 mt-2 space-y-3">
                {Object.entries(items).map(([itemName, data]) => (
                  <div key={itemName}>
                    <p className="text-base font-bold">{data.total}x {itemName} (Total)</p>
                    {/* Mostra o detalhamento de sabores apenas se houver sabores */}
                    {Object.keys(data.sabores).length > 0 && (
                      <div className="pl-6">
                        {Object.entries(data.sabores).map(([sabor, count]) => (
                          <p key={sabor} className="text-sm text-gray-700">↳ {count}x {sabor}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 2: DETALHES POR CABANA */}
      <section>
        <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2">DETALHES POR CABANA</h2>
        <div className="space-y-6">
          {pendingOrders.map(order => (
            <div key={order.id} className="p-4 border rounded-lg page-break-inside-avoid">
              <h3 className="text-lg font-bold">Cabana {order.cabanaNumero} ({order.hospedeNome}) - Entrega: {order.horarioEntrega}</h3>
              <ul className="list-disc list-inside text-sm mt-2">
                {order.itensPedido.map((item, index) => (
                   <li key={index}>
                    {item.quantidade}x {item.nomeItem}
                    {item.sabor && <span className="text-gray-600"> ({item.sabor})</span>}
                  </li>
                ))}
              </ul>
              {order.observacoesGerais && <p className="mt-2 text-sm italic"><strong>Obs:</strong> {order.observacoesGerais}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};