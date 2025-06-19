'use client';

import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';

interface OrderReceiptLayoutProps {
  order: Order | null;
}

// Função auxiliar para agrupar os itens do pedido por sua categoria
const groupItemsByCategory = (items: ItemPedido[]) => {
  const pratosQuentes = items.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
  const bebidas = items.filter(item => item.categoria?.toLowerCase().includes('bebidas'));
  const paes = items.filter(item => item.categoria?.toLowerCase().includes('pães'));
  const acompanhamentos = items.filter(item => item.categoria?.toLowerCase().includes('acompanhamentos'));
  const outros = items.filter(item => 
    !item.categoria?.toLowerCase().includes('pratos quentes') &&
    !item.categoria?.toLowerCase().includes('bebidas') &&
    !item.categoria?.toLowerCase().includes('pães') &&
    !item.categoria?.toLowerCase().includes('acompanhamentos')
  );

  return { pratosQuentes, bebidas, paes, acompanhamentos, outros };
};


export const OrderReceiptLayout = ({ order }: OrderReceiptLayoutProps) => {
  if (!order) {
    return null;
  }

  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);
  
  // Componente interno para renderizar as seções e evitar repetição de código
  const ItemSection = ({ title, items }: { title: string, items: ItemPedido[] }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-1">
        <p className="uppercase">{title}:</p>
        {items.map((item, index) => (
          <p key={index} className="pl-2">
            - {item.quantidade}x {item.nomeItem}
          </p>
        ))}
        <div className="border-t border-black my-1 border-dashed"></div>
      </div>
    );
  };

  return (
    // Container principal: define a largura, fonte e o estilo NEGRITO para tudo
    <div 
      className="p-2 font-sans text-black bg-white font-bold" 
      style={{ width: '80mm', boxSizing: 'border-box', fontSize: '12px' }}
    >
      {/* Cabeçalho */}
      <div className="text-center">
        <p className="text-xl">CABANA {order.cabanaNumero}</p>
      </div>
      <div className="text-xs mt-2">
        <p>NOME: {order.hospedeNome}</p>
        <p>HORA DE ENTREGA: {order.horarioEntrega}</p>
        {order.observacoesGerais && <p>OBS GERAL: {order.observacoesGerais}</p>}
      </div>
      <div className="border-t border-black my-1 border-dashed"></div>

      {/* Seção de Pratos Quentes (formato especial) */}
      {groupedItems.pratosQuentes.length > 0 && (
        <div className="mt-1">
          <p className="uppercase">PRATOS QUENTES:</p>
          {groupedItems.pratosQuentes.map((item, index) => (
            <p key={index} className="pl-2">- {item.nomeItem} | {item.sabor}</p>
          ))}
          {order.observacoesPratosQuentes && <p className="mt-1">OBS PRATOS QUENTES: {order.observacoesPratosQuentes}</p>}
          <div className="border-t border-black my-1 border-dashed"></div>
        </div>
      )}

      {/* Outras seções de itens */}
      <ItemSection title="BEBIDAS" items={groupedItems.bebidas} />
      <ItemSection title="PÃES" items={groupedItems.paes} />
      <ItemSection title="ACOMPANHAMENTOS" items={groupedItems.acompanhamentos} />
      <ItemSection title="OUTROS" items={groupedItems.outros} />

    </div>
  );
};