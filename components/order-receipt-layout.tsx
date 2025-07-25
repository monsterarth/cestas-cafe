<<<<<<< HEAD
=======
// components/order-receipt-layout.tsx
>>>>>>> codigo-novo/main
'use client';

import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';
<<<<<<< HEAD
=======
// ATUALIZAÇÃO: Importando a função de agrupamento
import { groupItemsByCategory } from '@/lib/order-utils';
>>>>>>> codigo-novo/main

interface OrderReceiptLayoutProps {
  order: Order | null;
}

<<<<<<< HEAD
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


=======
>>>>>>> codigo-novo/main
export const OrderReceiptLayout = ({ order }: OrderReceiptLayoutProps) => {
  if (!order) {
    return null;
  }

<<<<<<< HEAD
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
=======
  // ATUALIZAÇÃO: Usando a função de agrupamento centralizada
  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);
  
  return (
>>>>>>> codigo-novo/main
    <div 
      className="p-2 font-sans text-black bg-white font-bold" 
      style={{ width: '80mm', boxSizing: 'border-box', fontSize: '12px' }}
    >
<<<<<<< HEAD
      {/* Cabeçalho */}
=======
>>>>>>> codigo-novo/main
      <div className="text-center">
        <p className="text-xl">CABANA {order.cabanaNumero}</p>
      </div>
      <div className="text-xs mt-2">
        <p>NOME: {order.hospedeNome}</p>
        <p>HORA DE ENTREGA: {order.horarioEntrega}</p>
        {order.observacoesGerais && <p>OBS GERAL: {order.observacoesGerais}</p>}
      </div>
      <div className="border-t border-black my-1 border-dashed"></div>

<<<<<<< HEAD
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

=======
      {/* ATUALIZAÇÃO: Renderizando com base nas categorias corretas */}
      {Array.from(groupedItems.entries()).map(([category, items]) => {
          if (items.length === 0) return null;

          // Lógica para renderizar observações de pratos quentes
          const categoryNotes = category === 'Pratos Quentes' ? order.observacoesPratosQuentes : null;

          return (
            <div key={category} className="mt-1">
              <p className="uppercase">{category}:</p>
              {items.map((item, index) => (
                <p key={index} className="pl-2">- {item.quantidade}x {item.nomeItem} {item.sabor ? `| ${item.sabor}` : ''}</p>
              ))}
              {categoryNotes && <p className="mt-1 text-xs">OBS {category.toUpperCase()}: {categoryNotes}</p>}
              <div className="border-t border-black my-1 border-dashed"></div>
            </div>
          )
      })}
>>>>>>> codigo-novo/main
    </div>
  );
};