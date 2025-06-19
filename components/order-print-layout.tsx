import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintLayoutProps {
  order: Order;
}

// Removido React.forwardRef
export const OrderPrintLayout = ({ order }: OrderPrintLayoutProps) => {
  const allItems = order.itensPedido || [];
  
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    // Removida a 'ref' da div
    <div className="p-10 font-sans bg-white text-black">
      <header className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold">Relatório de Pedido</h1>
      </header>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 border-b pb-1">Detalhes do Hóspede</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <p><strong>Hóspede:</strong> {order.hospedeNome}</p>
          <p><strong>Cabana:</strong> {order.cabanaNumero}</p>
          <p><strong>Data do Pedido:</strong> {order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
          <p><strong>Entrega Agendada:</strong> {order.horarioEntrega}</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 border-b pb-1">Itens Selecionados (Organizado para Cozinha)</h2>
        <div className="space-y-4 mt-3">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-bold text-base uppercase text-gray-700">{category}</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                {items.map((item, index) => (
                  <li key={index}>
                    {item.quantidade}x {item.nomeItem}
                    {item.sabor && <span className="text-gray-600"> ({item.sabor})</span>}
                    {item.observacao && <em className="text-gray-600 block pl-4 text-xs"> - Obs: {item.observacao}</em>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {order.observacoesGerais && (
        <section className="mt-4 pt-2 border-t">
          <h2 className="text-xl font-semibold mb-2">Observações Gerais</h2>
          <p className="p-2 border rounded-md bg-gray-50 text-sm">{order.observacoesGerais}</p>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
        <p>ID do Pedido: {order.id}</p>
      </footer>
    </div>
  );
};