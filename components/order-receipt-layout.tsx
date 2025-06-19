// Arquivo: components/order-receipt-layout.tsx
'use client';

import { Order, ItemPedido } from '@/types';
import { useMemo } from 'react';

// Função auxiliar para agrupar itens do pedido por categoria
const groupItemsByCategory = (items: ItemPedido[]) => {
  const pratosQuentes = items.filter(item => item.categoria?.toLowerCase().includes('pratos quentes'));
  const bebidas = items.filter(item => item.categoria?.toLowerCase().includes('bebidas'));
  const paes = items.filter(item => item.categoria?.toLowerCase().includes('pães'));
  const outros = items.filter(item => 
    !item.categoria?.toLowerCase().includes('pratos quentes') &&
    !item.categoria?.toLowerCase().includes('bebidas') &&
    !item.categoria?.toLowerCase().includes('pães')
  );

  return { pratosQuentes, bebidas, paes, outros };
};


export const OrderReceiptLayout = ({ order }: { order: Order | null }) => {
  if (!order) {
    return null;
  }

  const { pratosQuentes, bebidas, paes, outros } = useMemo(() => groupItemsByCategory(order.itensPedido || []), [order.itensPedido]);

  // Componente auxiliar para renderizar seções
  const ItemSection = ({ title, items }: { title: string, items: ItemPedido[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-2">
        <p className="uppercase">{title}:</p>
        {items.map((item, index) => (
          <p key={index} className="pl-2">
            - {item.quantidade}x {item.nomeItem}
            {item.sabor && ` | ${item.sabor}`}
            {` (para ${order.numeroPessoas} pessoas)`}
          </p>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-1 font-mono text-black bg-white font-bold" style={{ width: '80mm', boxSizing: 'border-box', fontSize: '11px' }}>
      <div className="text-center">
        <p className="text-lg">CABANA {order.cabanaNumero}</p>
      </div>

      <div className="text-xs my-1">
        <p>NOME: {order.hospedeNome}</p>
        <p>HORA DE ENTREGA: {order.horarioEntrega}</p>
        {order.observacoesGerais && <p>OBS GERAL: {order.observacoesGerais}</p>}
      </div>
      
      <div className="border-t border-black my-1"></div>

      {pratosQuentes.length > 0 && (
        <>
          <div className="text-xs">
            <p className="uppercase">PRATOS QUENTES:</p>
            {pratosQuentes.map((item, index) => (
              <p key={index} className="pl-2">- {item.nomeItem} | {item.sabor}</p>
            ))}
          </div>
          {order.observacoesPratosQuentes && <p className="text-xs">OBS PRATOS QUENTES: {order.observacoesPratosQuentes}</p>}
          <div className="border-t border-black my-1"></div>
        </>
      )}

      <ItemSection title="BEBIDAS" items={bebidas} />
      {bebidas.length > 0 && <div className="border-t border-black my-1"></div>}

      <ItemSection title="PÃES" items={paes} />
      {paes.length > 0 && <div className="border-t border-black my-1"></div>}
      
      <ItemSection title="OUTROS" items={outros} />
      {outros.length > 0 && <div className="border-t border-black my-1"></div>}

    </div>
  );
};