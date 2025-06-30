// components/order-receipt-layout.tsx
'use client';

import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';
// ATUALIZAÇÃO: Importando a função de agrupamento
import { groupItemsByCategory } from '@/lib/order-utils';

interface OrderReceiptLayoutProps {
  order: Order | null;
}

export const OrderReceiptLayout = ({ order }: OrderReceiptLayoutProps) => {
  if (!order) {
    return null;
  }

  // ATUALIZAÇÃO: Usando a função de agrupamento centralizada
  const groupedItems = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);
  
  return (
    <div 
      className="p-2 font-sans text-black bg-white font-bold" 
      style={{ width: '80mm', boxSizing: 'border-box', fontSize: '12px' }}
    >
      <div className="text-center">
        <p className="text-xl">CABANA {order.cabanaNumero}</p>
      </div>
      <div className="text-xs mt-2">
        <p>NOME: {order.hospedeNome}</p>
        <p>HORA DE ENTREGA: {order.horarioEntrega}</p>
        {order.observacoesGerais && <p>OBS GERAL: {order.observacoesGerais}</p>}
      </div>
      <div className="border-t border-black my-1 border-dashed"></div>

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
    </div>
  );
};