// Arquivo: components/comanda-thermal-receipt.tsx
'use client';

import { AppConfig, Comanda } from "@/types"; // [MODIFICADO] Adicionado AppConfig
// MUDANÇA: Importa apenas o QRCodeSVG para garantir consistência
import { QRCodeSVG } from 'qrcode.react';

interface ComandaThermalReceiptProps {
    comanda: Comanda | null;
    config: AppConfig | null; // [ADICIONADO] Nova prop de configuração
}

export function ComandaThermalReceipt({ comanda, config }: ComandaThermalReceiptProps) {
    if (!comanda) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fazendadorosa.com.br';
    const qrCodeUrl = `${baseUrl}/?token=${comanda.token}`;

    return (
        <div 
            className="p-4 font-mono text-black bg-white"
            style={{ width: '80mm', boxSizing: 'border-box' }}
        >
            <div className="text-center mb-4">
                {/* [MODIFICADO] Usa texto do config com fallback */}
                <h1 className="text-lg font-bold">{config?.comandaTitle || 'Fazenda do Rosa'}</h1>
                <p className="text-xs">{config?.comandaSubtitle || 'Sua Comanda de Café da Manhã'}</p>
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
                <QRCodeSVG
                    value={qrCodeUrl}
                    size={128}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                />
                 {/* [MODIFICADO] Usa texto do config com fallback */}
                <p className="text-xs mt-2">{config?.comandaPostQr || 'Escaneie para iniciar o pedido'}</p>
            </div>

            <div className="border-t border-dashed border-black pt-2 text-center text-xs whitespace-pre-line">
                {/* [MODIFICADO] Usa texto do config com fallback e suporte para quebra de linha */}
                <p>{config?.comandaFooter || 'Apresente este ticket se necessário.\nBom apetite!'}</p>
            </div>
        </div>
    );
}