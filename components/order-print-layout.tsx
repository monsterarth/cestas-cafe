// Arquivo: components/order-print-layout.tsx

'use client';

import { Order, ItemPedido } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintLayoutProps {
  order: Order | null;
}

export const OrderPrintLayout = ({ order }: OrderPrintLayoutProps) => {
  if (!order) {
    return null;
  }

  const itens = order.itensPedido || [];
  const itensAgrupados = itens.reduce((acc, item) => {
    const categoria = item.categoria || 'Itens Diversos';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, ItemPedido[]>);


  return (
    <div className="p-8 font-sans bg-white text-black" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-400">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fazenda do Rosa</h1>
          <p className="text-gray-600">Detalhes do Pedido de Café da Manhã</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">Pedido #{order.id.substring(0, 6)}</p>
          <p className="text-sm text-gray-600">
            {order.timestampPedido?.toDate ? format(order.timestampPedido.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}
          </p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Informações do Hóspede</h2>
          <p><span className="font-semibold">Nome:</span> {order.hospedeNome}</p>
          <p><span className="font-semibold">Cabana:</span> {order.cabanaNumero}</p>
          <p><span className="font-semibold">Nº de Pessoas:</span> {order.numeroPessoas}</p>
          <p><span className="font-semibold">Horário de Entrega:</span> {order.horarioEntrega}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Observações do Pedido</h2>
          <p className="font-semibold">Gerais:</p>
          <p className="text-sm italic mb-2">{order.observacoesGerais || "Nenhuma observação."}</p>
          <p className="font-semibold">Pratos Quentes:</p>
          <p className="text-sm italic">{order.observacoesPratosQuentes || "Nenhuma observação."}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Checklist de Itens</h2>
        {Object.entries(itensAgrupados).map(([categoria, itensDaCategoria]) => (
           <div key={categoria} className="mb-4">
              <h3 className="text-md font-bold text-gray-600 border-b pb-1 mb-2 uppercase">{categoria}</h3>
              <ul className="list-none space-y-1 pl-2">
                {itensDaCategoria.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-5 h-5 border border-gray-400 rounded-sm mr-3"></div>
                    <span>{item.quantidade}x {item.nomeItem} {item.sabor && `(${item.sabor})`}</span>
                  </li>
                ))}
              </ul>
           </div>
        ))}
      </section>

    </div>
  );
};