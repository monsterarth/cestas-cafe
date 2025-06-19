// Arquivo: components/order-print-layout.tsx
'use client';

import { Order, ItemPedido } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

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

export const OrderPrintLayout = ({ order }: { order: Order | null }) => {
  if (!order) {
    return null;
  }

  const { pratosQuentes, bebidas, paes, acompanhamentos, outros } = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);
  
  const ItemSection = ({ title, items }: { title: string, items: ItemPedido[] }) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{title}</h3>
            <ul className="list-disc list-inside space-y-2 pl-2">
                {items.map((item, index) => (
                    <li key={index} className="text-gray-800">
                        <span className="font-bold">{item.quantidade}x</span> {item.nomeItem}
                        {item.sabor && <span className="text-gray-500 italic"> - Sabor: {item.sabor}</span>}
                    </li>
                ))}
            </ul>
        </div>
      );
  };
  
  return (
    <div className="p-10 font-sans bg-white text-black" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex justify-between items-start pb-6 border-b-4 border-gray-800">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Fazenda do Rosa</h1>
          <p className="text-lg text-gray-600">Comanda de Produção</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-xl">Pedido #{order.id.substring(0, 6)}</p>
          <p className="text-base text-gray-600">
            {order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}
          </p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-700 mb-3">Informações de Entrega</h2>
          <p className="text-lg"><span className="font-semibold">Hóspede:</span> {order.hospedeNome}</p>
          <p className="text-lg"><span className="font-semibold">Cabana:</span> {order.cabanaNumero}</p>
          <p className="text-lg"><span className="font-semibold">Entrega:</span> {order.horarioEntrega}</p>
          <p className="text-lg"><span className="font-semibold">Pedido para:</span> {order.numeroPessoas} pessoas</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-700 mb-3">Observações</h2>
          <p className="font-semibold">Gerais:</p>
          <p className="italic mb-2">{order.observacoesGerais || "Nenhuma."}</p>
          <p className="font-semibold">Pratos Quentes:</p>
          <p className="italic">{order.observacoesPratosQuentes || "Nenhuma."}</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Itens Solicitados</h2>
        <ItemSection title="Pratos Quentes" items={pratosQuentes} />
        <ItemSection title="Bebidas" items={bebidas} />
        <ItemSection title="Pães" items={paes} />
        <ItemSection title="Acompanhamentos" items={acompanhamentos} />
        <ItemSection title="Outros" items={outros} />
      </section>
    </div>
  );
};