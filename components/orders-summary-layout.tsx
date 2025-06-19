// Arquivo: components/order-print-layout.tsx
'use client';

import { Order, ItemPedido, AppConfig } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

interface OrderPrintLayoutProps {
  order: Order | null;
  config: AppConfig | null;
}

const groupItemsByCategory = (items: ItemPedido[]) => {
    const pratosQuentes = items.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
    const bebidas = items.filter(item => item.categoria?.toLowerCase().includes('bebidas'));
    const paes = items.filter(item => item.categoria?.toLowerCase().includes('pães'));
    const acompanhamentos = items.filter(item => item.categoria?.toLowerCase().includes('acompanhamentos'));
    
    // CORREÇÃO DO ERRO DE 'i' PARA 'item'
    const outros = items.filter(item => 
        !item.categoria?.toLowerCase().includes('pratos quentes') &&
        !item.categoria?.toLowerCase().includes('bebidas') &&
        !item.categoria?.toLowerCase().includes('pães') &&
        !item.categoria?.toLowerCase().includes('acompanhamentos')
    );
    return { pratosQuentes, bebidas, paes, acompanhamentos, outros };
};

export const OrderPrintLayout = ({ order, config }: OrderPrintLayoutProps) => {
  if (!order) {
    return null;
  }

  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);

  const motivationalMessage = useMemo(() => {
    const messages = config?.mensagensMotivacionais;
    if (!messages || messages.length === 0) return "Tenha um dia incrível!";
    return messages[Math.floor(Math.random() * messages.length)];
  }, [config]);

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
    // CORREÇÃO DE LAYOUT: Trocado flex por grid para ocupar a página inteira
    <div className="p-8 font-sans bg-white text-black" style={{ width: '210mm', height: '297mm', display: 'grid', gridTemplateRows: 'auto auto auto 1fr auto' }}>
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
      </section>

      {/* A tag <main> agora tem '1fr' de altura, então vai se esticar */}
      <main>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Itens para Coleta e Preparo</h2>
        {Object.entries(groupedItems).map(([category, items]) => (
            <ItemSection key={category} title={category} items={items} />
        ))}
      </main>

      <footer className="pt-4 text-center text-xs text-gray-400 border-t">
        <p>Por favor, confira todos os itens com atenção. Bom trabalho!</p>
      </footer>
    </div>
  );
};