// Arquivo: hooks/use-print.ts
'use client';

import { useState, useEffect } from 'react';
// MUDANÇA: Importa 'createRoot' da biblioteca correta
import { createRoot } from 'react-dom/client';

export function usePrint() {
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    let container = document.getElementById('print-portal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'print-portal-container';
      container.className = 'printable-area';
      document.body.appendChild(container);
    }
    setPrintContainer(container);

    return () => {
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  const printComponent = (component: React.ReactElement) => {
    if (printContainer) {
      setIsPrinting(true);

      // CORREÇÃO: Usa a nova API createRoot
      const root = createRoot(printContainer);
      root.render(component);

      // A renderização com createRoot é assíncrona.
      // Damos um pequeno tempo para o navegador renderizar antes de chamar a impressão.
      setTimeout(() => {
        window.print();
        // Após a impressão, desmontamos o componente e limpamos o portal
        root.unmount();
        setIsPrinting(false);
      }, 250); // Um delay de 250ms é geralmente seguro

    } else {
        console.error("Print container não encontrado.");
        alert("Erro ao preparar a impressão. Tente recarregar a página.");
    }
  };

  return { printComponent, isPrinting };
}