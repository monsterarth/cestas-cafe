'use client';

import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';

interface OrderReceiptLayoutProps {
  order: Order | null;
}

// Função auxiliar para agrupar itens do pedido por categoria
const groupItemsByCategory = (items: ItemPedido[]) => {
  const pratosQuentes = items.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
  const bebidas = items.filter(item => item.categoria?.toLowerCase().includes('bebidas'));
  const paes = items.filter(item => item.categoria?.toLowerCase().includes('pães'));
  
  const otherCategories = items.filter(item => 
    !item.categoria?.toLowerCase().includes('pratos quentes') &&
    !item.categoria?.toLowerCase().includes('bebidas') &&
    !item.categoria?.toLowerCase().includes('pães')
  ).reduce((acc, item) => {
    const categoryName = item.categoria || 'Outros';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, ItemPedido[]>);

  return { pratosQuentes, bebidas, paes, otherCategories };
};


export const OrderReceiptLayout = ({ order }: OrderReceiptLayoutProps) => {
  if (!order) {
    return null;
  }

  // Usamos useMemo para evitar recalcular a cada renderização
  const { pratosQuentes, bebidas, paes, otherCategories } = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);

  return (
    <div className="p-2 font-mono text-black bg-white" style={{ width: '80mm', boxSizing: 'border-box', fontSize: '11px' }}>
      <div className="text-center mb-2">
        <p className="font-bold text-lg">Cabana {order.cabanaNumero}</p>
      </div>

      <div className="flex justify-between text-xs border-y border-dashed border-black py-1">
        <span>Nome: {order.hospedeNome}</span>
        <span>Entrega: {order.horarioEntrega}</span>
      </div>

      {order.observacoesGerais && (
        <div className="mt-2 text-xs">
          <p className="font-bold uppercase">Obs. Geral:</p>
          <p>{order.observacoesGerais}</p>
        </div>
      )}
      
      <div className="mt-2 text-xs">
        {pratosQuentes.length > 0 && (
          <div className="mb-2">
            <p className="font-bold uppercase">Prato Quente:</p>
            {pratosQuentes.map((item, index) => (
              <p key={index} className="pl-2">{item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}</p>
            ))}
          </div>
        )}

        {order.observacoesPratosQuentes && (
          <div className="mb-2">
            <p className="font-bold uppercase">Obs. Prato Quente:</p>
            <p className="pl-2">{order.observacoesPratosQuentes}</p>
          </div>
        )}

        {bebidas.length > 0 && (
          <div className="mb-2">
            <p className="font-bold uppercase">Bebidas:</p>
            {bebidas.map((item, index) => (
              <p key={index} className="pl-2">{item.quantidade}x {item.nomeItem}</p>
            ))}
          </div>
        )}

        {paes.length > 0 && (
          <div className="mb-2">
            <p className="font-bold uppercase">Pães:</p>
            {paes.map((item, index) => (
              <p key={index} className="pl-2">{item.quantidade}x {item.nomeItem}</p>
            ))}
          </div>
        )}
        
        {Object.keys(otherCategories).map(categoryName => (
          <div key={categoryName} className="mb-2">
            <p className="font-bold uppercase">{categoryName}:</p>
            {otherCategories[categoryName].map((item, index) => (
              <p key={index} className="pl-2">{item.quantidade}x {item.nomeItem}</p>
            ))}
          </div>
        ))}
      </div>
      
      <div className="border-t border-black mt-2 pt-1"></div>

    </div>
  );
};