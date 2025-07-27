import React from 'react';
import { PurchaseOrder, AppConfig } from '@/types';
import { format } from 'date-fns';

interface Props {
    orders: PurchaseOrder[];
    config: AppConfig | null;
}

export const PurchaseOrdersSummaryLayout = React.forwardRef<HTMLDivElement, Props>(({ orders, config }, ref) => {
    // Agrupa todos os itens de todos os pedidos por fornecedor
    const itemsBySupplier = orders.reduce((acc, order) => {
        if (!acc[order.supplierName]) {
            acc[order.supplierName] = [];
        }
        acc[order.supplierName].push(...order.items);
        return acc;
    }, {} as Record<string, typeof orders[0]['items']>);

    return (
        <div ref={ref} className="p-8 font-sans bg-white text-black">
            <header className="text-center border-b pb-4">
                <h1 className="text-3xl font-bold">{config?.nomeFazenda || 'Resumo de Pedidos de Compra'}</h1>
                <p>Data de Emissão: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </header>

            <main className="mt-8 space-y-8">
                {Object.entries(itemsBySupplier).map(([supplierName, items]) => (
                     <div key={supplierName}>
                        <h2 className="text-xl font-semibold mb-4 bg-gray-100 p-2 rounded">Fornecedor: {supplierName}</h2>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Produto</th>
                                    <th className="p-2 text-center">Qtd. Pedida</th>
                                    <th className="p-2 text-center">Unidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={`${item.itemId}-${index}`} className="border-b">
                                        <td className="p-2">{item.itemName}</td>
                                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                                        <td className="p-2 text-center">{item.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </main>
             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>Este é um resumo consolidado de {orders.length} pedido(s) de compra.</p>
            </footer>
        </div>
    );
});

PurchaseOrdersSummaryLayout.displayName = 'PurchaseOrdersSummaryLayout';