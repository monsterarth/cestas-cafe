import React from 'react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintLayoutProps {
  order: Order;
}

export const OrderPrintLayout = React.forwardRef<HTMLDivElement, OrderPrintLayoutProps>(({ order }, ref) => {
  return (
    <div ref={ref} className="p-10 font-sans bg-white text-black">
      <header className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold">Relatório de Pedido</h1>
      </header>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 border-b pb-1">Detalhes do Hóspede</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {/* CORREÇÃO: Usando os nomes corretos das propriedades do seu tipo 'Order' */}
          <p><strong>Hóspede:</strong> {order.hospedeNome}</p>
          <p><strong>Cabana:</strong> {order.cabanaNumero}</p>
          <p><strong>Data do Pedido:</strong> {order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
          <p><strong>Entrega Agendada:</strong> {order.horarioEntrega}</p>
          <p><strong>Pessoas:</strong> {order.numeroPessoas}</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 border-b pb-1">Itens Selecionados</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {/* CORREÇÃO: Usando a propriedade 'itensPedido' do seu tipo 'Order' */}
          {(order.itensPedido || []).map((item, index) => (
             <li key={index}>
                {item.quantidade}x {item.nomeItem}
                {item.observacao && <em className="text-gray-600 block pl-4 text-xs"> - Obs: {item.observacao}</em>}
             </li>
          ))}
        </ul>
      </section>

      {/* CORREÇÃO: Usando as propriedades de observações corretas */}
      {order.observacoesGerais && (
        <section className="mt-4 pt-2 border-t">
          <h2 className="text-xl font-semibold mb-2">Observações Gerais</h2>
          <p className="p-2 border rounded-md bg-gray-50 text-sm">{order.observacoesGerais}</p>
        </section>
      )}

      {order.observacoesPratosQuentes && (
        <section className="mt-4 pt-2 border-t">
          <h2 className="text-xl font-semibold mb-2">Observações (Pratos Quentes)</h2>
          <p className="p-2 border rounded-md bg-gray-50 text-sm">{order.observacoesPratosQuentes}</p>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
        <p>Relatório gerado pelo Sistema de Cestas de Café.</p>
      </footer>
    </div>
  );
});

OrderPrintLayout.displayName = 'OrderPrintLayout';