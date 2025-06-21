// Arquivo: components/comanda-thermal-receipt.tsx
'use client';

import { Comanda } from "@/types";
import { QRCodeCanvas } from 'qrcode.react';

interface ComandaThermalReceiptProps {
    comanda: Comanda | null;
}

export function ComandaThermalReceipt({ comanda }: ComandaThermalReceiptProps) {
    if (!comanda) return null;

    const qrCodeUrl = `${window.location.origin}/?token=${comanda.token}`;

    return (
        <div 
            className="p-4 font-mono text-black bg-white"
            style={{ width: '80mm', boxSizing: 'border-box' }}
        >
            <div className="text-center mb-4">
                <h1 className="text-lg font-bold">Fazenda do Rosa</h1>
                <p className="text-xs">Sua Comanda de Café da Manhã</p>
            </div>

            <div className="text-sm space-y-1 mb-4">
                <p><strong>Hóspede:</strong> {comanda.guestName}</p>
                <p><strong>Cabana:</strong> {comanda.cabin}</p>
                <p><strong>Pessoas:</strong> {comanda.numberOfGuests}</p>
            </div>
            
            <div className="text-center my-4">
                <p className="text-xs uppercase">Seu código de acesso:</p>
                <p className="text-3xl font-bold tracking-widest bg-gray-200 p-2 rounded-md my-1">
                    {comanda.token}
                </p>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center my-4">
                <QRCodeCanvas
                    value={qrCodeUrl}
                    size={128}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                />
                <p className="text-xs mt-2">Escaneie para iniciar o pedido</p>
            </div>

            <div className="border-t border-dashed border-black pt-2 text-center text-xs">
                <p>Apresente este ticket se necessário.</p>
                <p>Bom apetite!</p>
            </div>
        </div>
    );
}