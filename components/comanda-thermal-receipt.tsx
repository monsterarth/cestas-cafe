// Arquivo: components/comanda-thermal-receipt.tsx
import { Comanda } from "@/types";
import QRCode from "react-qr-code";
import React from "react";

interface ComandaThermalReceiptProps {
  comanda: Comanda;
  pousadaName?: string;
}

// Não precisa mais do React.forwardRef
export function ComandaThermalReceipt({
  comanda,
  pousadaName = "Pousada Aconchego",
}: ComandaThermalReceiptProps) {
  // Verificação para garantir que window está disponível (evita erros no lado do servidor)
  const orderUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?token=${comanda.token}` 
    : '';

  return (
    // A ref será colocada aqui pelo componente pai
    <div className="w-[80mm] p-2 bg-white text-black font-mono text-sm">
      <div className="text-center space-y-2">
        <h1 className="text-lg font-bold">{pousadaName}</h1>
        <p>Seu acesso para a Cesta de Café da Manhã</p>
      </div>

      <hr className="my-3 border-dashed border-black" />

      <div className="space-y-1">
        <p><strong>Hóspede:</strong> {comanda.guestName}</p>
        <p><strong>Cabana:</strong> {comanda.cabin}</p>
      </div>

      <hr className="my-3 border-dashed border-black" />

      <p className="text-center">Use o QR Code ou o código abaixo para iniciar seu pedido:</p>

      <div className="flex justify-center my-4">
        <div className="p-2 bg-white inline-block">
          {/* Garante que o QR Code só renderize no cliente */}
          {orderUrl && <QRCode value={orderUrl} size={160} />}
        </div>
      </div>

      <div className="text-center">
        <p>Seu código:</p>
        <p className="text-3xl font-bold tracking-widest my-2 p-2 border border-black">
          {comanda.token}
        </p>
      </div>

      <hr className="my-3 border-dashed border-black" />
      <p className="text-xs text-center">
        Apresente esta comanda no café da manhã. Válido apenas durante a sua estadia.
      </p>
    </div>
  );
}