import React from 'react';
import { PurchaseOrder, AppConfig } from '@/types';
import { format } from 'date-fns';

interface Props {
    order: PurchaseOrder;
    config: AppConfig | null;
}

export const PurchaseOrderPrintLayout = React.forwardRef<HTMLDivElement, Props>(({ order, config }, ref) => {
    return (
        <div ref={ref} className="p-8 font-sans bg-white text-black">
            <header className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold">{config?.nomeFazenda || 'Pedido de Compra'}</h1>
                    <p>Para: {order.supplierName}</p>
                </div>
                <div className="text-right">
                    <p><strong>Pedido Nº:</strong> {order.id.substring(0, 8).toUpperCase()}</p>
                    <p><strong>Data:</strong> {order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</p>
                    <p><strong>Solicitante:</strong> {order.requestedBy}</p>
                </div>
            </header>

            <main className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Itens Solicitados</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2">Produto</th>
                            <th className="p-2 text-center">Estoque Acusado</th>
                            <th className="p-2 text-center">Quantidade Pedida</th>
                            <th className="p-2 text-center">Unidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.itemId} className="border-b">
                                <td className="p-2">{item.itemName}</td>
                                <td className="p-2 text-center">{item.inStock}</td>
                                <td className="p-2 text-center font-bold">{item.quantity}</td>
                                <td className="p-2 text-center">{item.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>

            <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Este é um documento gerado pelo sistema.</p>
            </footer>
        </div>
    );
});

PurchaseOrderPrintLayout.displayName = 'PurchaseOrderPrintLayout';