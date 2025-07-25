<<<<<<< HEAD
// Arquivo: components/order-print-layout.tsx
=======
// components/order-print-layout.tsx
>>>>>>> codigo-novo/main
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
<<<<<<< HEAD
=======
// ATUALIZAÇÃO: Importando a nova função de agrupamento
import { groupItemsByCategory } from '@/lib/order-utils';
>>>>>>> codigo-novo/main

interface OrderPrintLayoutProps {
  order: Order | null;
  config: AppConfig | null;
}

<<<<<<< HEAD
const groupItemsByCategory = (items: ItemPedido[]) => {
    const pratosQuentes = items.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
    const bebidas = items.filter(item => item.categoria?.toLowerCase().includes('bebidas'));
    const paes = items.filter(item => item.categoria?.toLowerCase().includes('pães'));
    const acompanhamentos = items.filter(item => item.categoria?.toLowerCase().includes('acompanhamentos'));
    
    // ESTA É A VERSÃO CORRIGIDA DA LÓGICA
    const outros = items.filter(item => 
        !item.categoria?.toLowerCase().includes('pratos quentes') &&
        !item.categoria?.toLowerCase().includes('bebidas') &&
        !item.categoria?.toLowerCase().includes('pães') &&
        !item.categoria?.toLowerCase().includes('acompanhamentos')
    );
    return { pratosQuentes, bebidas, paes, acompanhamentos, outros };
};

=======
>>>>>>> codigo-novo/main
export const OrderPrintLayout = ({ order, config }: OrderPrintLayoutProps) => {
  if (!order) {
    return null;
  }

<<<<<<< HEAD
  // Agora, com a lógica corrigida, a chamada abaixo vai funcionar
=======
  // ATUALIZAÇÃO: Usando a função centralizada para agrupar
>>>>>>> codigo-novo/main
  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);

  const motivationalMessage = useMemo(() => {
    const messages = config?.mensagensMotivacionais;
    if (!messages || messages.length === 0) return "Tenha um dia incrível!";
    return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

<<<<<<< HEAD
  const ItemSection = ({ title, items }: { title: string, items: ItemPedido[] }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{title}</h3>
        <ul className="list-none space-y-1.5 pl-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center text-base">
              <div className="w-5 h-5 border-2 border-gray-400 rounded-sm mr-4 flex-shrink-0"></div>
              <span className="font-semibold">{item.quantidade}x</span>
              <span className="mx-2">{item.nomeItem}</span>
              {item.sabor && <span className="text-gray-600 font-light italic">({item.sabor})</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  return (
    <div className="p-8 font-sans bg-white text-black" style={{ width: '210mm', height: '297mm', display: 'grid', gridTemplateRows: 'auto auto auto 1fr auto' }}>
=======
  return (
    // ATUALIZAÇÃO: Container principal com fontes ligeiramente reduzidas
    <div className="p-8 font-sans bg-white text-black" style={{ width: '210mm', minHeight: '297mm', fontSize: '11pt' }}>
>>>>>>> codigo-novo/main
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
      
<<<<<<< HEAD
      <div className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-base italic text-yellow-800">"{motivationalMessage}"</p>
      </div>

      <section className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Informações do Hóspede</h2>
          <p><span className="font-semibold">Nome:</span> {order.hospedeNome}</p>
          <p><span className="font-semibold">Cabana:</span> {order.cabanaNumero}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Detalhes da Entrega</h2>
          <p><span className="font-semibold">Horário:</span> {order.horarioEntrega}</p>
          <p><span className="font-semibold">Para:</span> {order.numeroPessoas} pessoas</p>
        </div>
=======
      <div className="my-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-base italic text-yellow-800">"{motivationalMessage}"</p>
      </div>

      <section className="grid grid-cols-2 gap-6 mb-5">
        <div className="bg-gray-50 p-4 rounded-lg"><h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Informações do Hóspede</h2><p><span className="font-semibold">Nome:</span> {order.hospedeNome}</p><p><span className="font-semibold">Cabana:</span> {order.cabanaNumero}</p></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h2 className="text-base font-bold text-gray-700 mb-2 uppercase">Detalhes da Entrega</h2><p><span className="font-semibold">Horário:</span> {order.horarioEntrega}</p><p><span className="font-semibold">Para:</span> {order.numeroPessoas} pessoas</p></div>
>>>>>>> codigo-novo/main
      </section>

      <main>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Itens para Coleta e Preparo</h2>
<<<<<<< HEAD
        {/* Renderiza as seções com base nos itens agrupados */}
        <ItemSection title="Pratos Quentes" items={groupedItems.pratosQuentes} />
        <ItemSection title="Bebidas" items={groupedItems.bebidas} />
        <ItemSection title="Pães" items={groupedItems.paes} />
        <ItemSection title="Acompanhamentos" items={groupedItems.acompanhamentos} />
        <ItemSection title="Outros" items={groupedItems.outros} />
      </main>

      <footer className="pt-4 text-center text-xs text-gray-400 border-t">
        <p>Por favor, confira todos os itens com atenção. Bom trabalho!</p>
      </footer>
=======
        
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
>>>>>>> codigo-novo/main
    </div>
  );
};