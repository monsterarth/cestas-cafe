// components/order-print-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
// ATUALIZAÇÃO: Importando a nova função de agrupamento
import { groupItemsByCategory } from '@/lib/order-utils';

interface OrderPrintLayoutProps {
  order: Order | null;
  config: AppConfig | null;
}

export const OrderPrintLayout = ({ order, config }: OrderPrintLayoutProps) => {
  if (!order) {
    return null;
  }

  // ATUALIZAÇÃO: Usando a função centralizada para agrupar
  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);

  const motivationalMessage = useMemo(() => {
    const messages = config?.mensagensMotivacionais;
    if (!messages || messages.length === 0) return "Tenha um dia incrível!";
    return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

  return (
    // ATUALIZAÇÃO: Container principal com fontes ligeiramente reduzidas
    <div className="p-8 font-sans bg-white text-black" style={{ width: '210mm', minHeight: '297mm', fontSize: '11pt' }}>
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{config?.nomeFazenda || "Fazenda do Rosa"}</h1>
          <p className="text-lg text-gray-600">Checklist de Montagem da Cesta</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">Pedido #{order.id.substring(0, 6)}</p>
          <p className="text-sm text-gray-500">
            {order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
          </p>
        </div>
      </header>
      
      <div className="my-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-base italic text-yellow-800">"{motivationalMessage}"</p>
      </div>

      <section className="grid grid-cols-2 gap-6 mb-5">
        <div className="bg-gray-50 p-4 rounded-lg"><h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Informações do Hóspede</h2><p><span className="font-semibold">Nome:</span> {order.hospedeNome}</p><p><span className="font-semibold">Cabana:</span> {order.cabanaNumero}</p></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Detalhes da Entrega</h2><p><span className="font-semibold">Horário:</span> {order.horarioEntrega}</p><p><span className="font-semibold">Para:</span> {order.numeroPessoas} pessoas</p></div>
      </section>

      <main>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Itens para Coleta e Preparo</h2>
        
        {/* ATUALIZAÇÃO: Layout em duas colunas para a lista de itens */}
        <div className="grid grid-cols-2 gap-x-8">
            {Array.from(groupedItems.entries()).map(([category, items]) => {
                if (items.length === 0) return null;
                
                return (
                    <div key={category} className="mb-4 break-inside-avoid">
                        <h3 className="text-md font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{category}</h3>
                        <ul className="list-none space-y-1.5 pl-1">
                            {items.map((item, index) => (
                                <li key={index} className="flex items-start text-base">
                                    <div className="w-5 h-5 border-2 border-gray-400 rounded-sm mr-3 mt-1 flex-shrink-0"></div>
                                    <div>
                                      <span><span className="font-semibold">{item.quantidade}x</span> {item.nomeItem}</span>
                                      {item.sabor && <span className="text-gray-600 font-light italic ml-1">({item.sabor})</span>}
                                      {item.observacao && <p className="text-xs text-gray-500 font-light pl-1">Obs: {item.observacao}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
      </main>
    </div>
  );
};