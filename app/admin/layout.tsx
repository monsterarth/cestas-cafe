export const dynamic = 'force-dynamic';

import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore"; // Importe 'doc' e 'getDoc'
import { ThemeInjector } from "@/components/theme-injector";
import { Toaster } from "@/components/ui/sonner";
import {
  Home,
  Settings,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppConfig } from "@/types"; // Importe o tipo AppConfig

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await getFirebaseDb();
  if (!db) {
    return (
      <div className="flex h-screen items-center justify-center">
        Erro ao conectar com a base de dados.
      </div>
    );
  }

  // --- INÍCIO DA CORREÇÃO ---
  // 1. Buscar o documento de configuração do Firestore
  const configRef = doc(db, "config", "main");
  const configSnap = await getDoc(configRef);
  const config = configSnap.exists() ? (configSnap.data() as AppConfig) : null;
  // --- FIM DA CORREÇÃO ---


  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div id="admin-root">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="/admin/orders"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <ShoppingCart className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Pedidos</span>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Package className="h-5 w-5" />
                    <span className="sr-only">Cardápio</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Cardápio</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/settings"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Configurações</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Configurações</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>

      <div id="print-container"></div>
      <Toaster />
      {/* 2. Passe a configuração para o ThemeInjector */}
      {config && <ThemeInjector config={config} />}
    </div>
  );
}