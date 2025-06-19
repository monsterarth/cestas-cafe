import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderReceiptLayoutProps {
  order: Order;
}

export const OrderReceiptLayout = React.forwardRef<HTMLDivElement, OrderReceiptLayoutProps>(({ order }, ref) => {
  const allItems = order.itensPedido || [];
  
  // Agrupando itens por categoria para a cozinha
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div ref={ref} className="p-1 font-mono text-xs bg-white text-black" style={{ width: '80mm' }}>
      <div className="text-center mb-2">
        <h1 className="font-bold text-sm">PEDIDO - CESTA DE CAFÉ</h1>
        <p>Hóspede: {order.hospedeNome}</p>
        <p>Cabana: {order.cabanaNumero}</p>
        <p>Entrega: {order.horarioEntrega}</p>
      </div>
      
      <div className="border-t border-b border-dashed border-black py-2 my-2">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="mb-2">
            <h2 className="font-bold uppercase">-- {category} --</h2>
            {items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantidade}x {item.nomeItem}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {order.observacoesGerais && (
        <div className="mt-2">
          <p className="font-bold uppercase">OBS. GERAIS:</p>
          <p>{order.observacoesGerais}</p>
        </div>
      )}
      
      <div className="text-center mt-2 pt-2 border-t border-dashed border-black">
        <p>Pedido: {order.id}</p>
        <p>{format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
});

OrderReceiptLayout.displayName = 'OrderReceiptLayout';