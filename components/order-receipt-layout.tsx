import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderReceiptLayoutProps {
  order: Order;
}

// SIMPLIFICADO: Não usa mais React.forwardRef
export const OrderReceiptLayout = ({ order }: OrderReceiptLayoutProps) => {
  // ... Conteúdo interno do componente sem alterações ...
  return (
    <div className="p-1 font-mono text-xs bg-white text-black" style={{ width: '80mm' }}>
      {/* ... todo o seu layout de comanda aqui ... */}
    </div>
  );
};