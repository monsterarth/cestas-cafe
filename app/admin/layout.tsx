// Arquivo: app/admin/layout.tsx
'use client';

export const dynamic = 'force-dynamic';

import type React from "react";
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
    if (pathname.includes("/orders")) return "Pedidos";
    if (pathname.includes("/menu")) return "Cardápio";
    if (pathname.includes("/settings")) return "Configurações";
    if (pathname === "/admin/comandas") return "Gerar Comandas";
    if (pathname === "/admin/comandas/gerenciar") return "Gerenciar Comandas"; // NOVO
    if (pathname === "/admin") return "Dashboard";
    return "Painel Administrativo";
  }

  return (
    <div className="min-h-screen bg-[#F7FDF2]">
      <div id="admin-root">
        <div className="flex h-screen">
          <aside className="w-64 bg-[#4B4F36] text-white flex flex-col">
            <div className="h-20 flex items-center justify-center border-b border-gray-700">
              <h1 className="text-2xl font-bold">Fazenda do Rosa</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              <Link href="/admin" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname === "/admin" ? "bg-[#97A25F]" : ""}`}>
                  Dashboard
              </Link>
              <Link href="/admin/orders" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname.startsWith("/admin/orders") ? "bg-[#97A25F]" : ""}`}>
                  Pedidos
              </Link>
              <div className="pl-4 border-l-2 border-gray-600">
                <Link href="/admin/comandas" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname === "/admin/comandas" ? "bg-[#97A25F]" : ""}`}>
                    Gerar Comanda
                </Link>
                <Link href="/admin/comandas/gerenciar" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname === "/admin/comandas/gerenciar" ? "bg-[#97A25F]" : ""}`}>
                    Gerenciar
                </Link>
              </div>
              <Link href="/admin/menu" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname.startsWith("/admin/menu") ? "bg-[#97A25F]" : ""}`}>
                  Cardápio
              </Link>
              <Link href="/admin/settings" className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${pathname.startsWith("/admin/settings") ? "bg-[#97A25F]" : ""}`}>
                  Configurações
              </Link>
            </nav>

            <div className="mt-auto p-4 space-y-2 border-t border-gray-700">
              <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-red-500 transition-colors text-left">
                Sair
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