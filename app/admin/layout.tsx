// Arquivo: app/admin/layout.tsx
'use client';

export const dynamic = 'force-dynamic';

import React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { LoadingScreen } from "@/components/loading-screen";
import { ThemeInjector } from "@/components/theme-injector";
import { Toaster } from "@/components/ui/sonner";
import type { AppConfig } from "@/types";
import { onAuthStateChanged, User } from "firebase/auth";
import { LayoutDashboard, ShoppingBasket, BarChart2, Ticket, Settings, Paintbrush, MessageSquare, Home, UtensilsCrossed, LogOut } from "lucide-react";

// Componente para links de navegação
const NavLink = ({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) => {
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${isActive ? "bg-[#97A25F]" : ""}`}>
      {children}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const db = await getFirebaseDb();
        if (db) {
          const configRef = doc(db, "configuracoes", "app");
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
            setConfig(configSnap.data() as AppConfig);
          }
        }
      } catch (error) {
        console.error("Falha ao buscar config no layout:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        if (!auth) {
          if (pathname !== "/admin/login") router.push("/admin/login");
          setLoading(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
          } else {
            if (pathname !== "/admin/login") {
              router.push("/admin/login");
            }
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Falha na verificação de autenticação:", error);
        if (pathname !== "/admin/login") router.push("/admin/login");
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);
  
  const handleLogout = async () => {
    const auth = await getFirebaseAuth();
    if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
        router.push("/admin/login");
    }
  };

  if (loading) {
    return <LoadingScreen message="Verificando acesso..." />;
  }
  
  if (!user && pathname !== "/admin/login") {
    return <LoadingScreen message="Redirecionando para o login..." />;
  }
  
  if (!user && pathname === "/admin/login") {
      return <>{children}</>;
  }

  const getHeaderText = () => {
    if (pathname === '/admin') return "Dashboard";
    if (pathname === '/admin/pedidos') return "Lista de Pedidos";
    if (pathname === '/admin/pedidos/estatisticas') return "Estatísticas de Pedidos";
    if (pathname === '/admin/comandas/criar') return "Criar Nova Comanda";
    if (pathname === '/admin/comandas/gerenciar') return "Gerenciar Comandas";
    if (pathname === '/admin/settings/aparencia') return "Configurações de Aparência";
    if (pathname === '/admin/settings/mensagens') return "Configurações de Mensagens";
    if (pathname === '/admin/settings/cabanas') return "Configurações de Cabanas";
    if (pathname === '/admin/menu') return "Editor de Cardápio";
    return "Painel Administrativo";
  }

  return (
    <div className="min-h-screen bg-[#F7FDF2]">
      <div id="admin-root">
        <div className="flex h-screen">
          <aside className="w-64 bg-[#4B4F36] text-white flex flex-col">
            <div className="h-20 flex items-center justify-center border-b border-gray-700">
              <h1 className="text-2xl font-bold">{config?.nomeFazenda || 'Painel Admin'}</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-4">
              <div>
                <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Principal</h3>
                <NavLink href="/admin" pathname={pathname}><LayoutDashboard size={18} /> Dashboard</NavLink>
              </div>

              <div>
                <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Operação</h3>
                <NavLink href="/admin/pedidos" pathname={pathname}><ShoppingBasket size={18} /> Pedidos</NavLink>
                <NavLink href="/admin/pedidos/estatisticas" pathname={pathname}><BarChart2 size={18} /> Estatísticas</NavLink>
              </div>
              
              <div>
                <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Comandas</h3>
                <NavLink href="/admin/comandas/criar" pathname={pathname}><Ticket size={18} /> Criar Comanda</NavLink>
                <NavLink href="/admin/comandas/gerenciar" pathname={pathname}><Settings size={18} /> Gerenciar</NavLink>
              </div>

              <div>
                <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Sistema</h3>
                <NavLink href="/admin/menu" pathname={pathname}><UtensilsCrossed size={18} /> Cardápio</NavLink>
                <NavLink href="/admin/settings/aparencia" pathname={pathname}><Paintbrush size={18} /> Aparência</NavLink>
                <NavLink href="/admin/settings/mensagens" pathname={pathname}><MessageSquare size={18} /> Mensagens</NavLink>
                <NavLink href="/admin/settings/cabanas" pathname={pathname}><Home size={18} /> Cabanas</NavLink>
              </div>
            </nav>

            <div className="mt-auto p-4 space-y-2 border-t border-gray-700">
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500 transition-colors text-left">
                  <LogOut size={18} /> Sair
               </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="h-20 bg-white flex items-center justify-between px-8 border-b border-[#ADA192]">
              <h2 className="text-2xl font-semibold text-[#4B4F36]">
                {getHeaderText()}
              </h2>
              {user && <span className="mr-4 text-[#ADA192]">{user.email}</span>}
            </header>
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>
      <div id="print-container-portal" className="printable-area"></div>
      <Toaster />
      {config && <ThemeInjector config={config} />}
    </div>
  );
}