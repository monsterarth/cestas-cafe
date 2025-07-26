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
import { LogOut, ExternalLink, Menu } from "lucide-react";
import { AdminNav, navSections } from "@/components/admin-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
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

  if (loading) return <LoadingScreen message="Verificando acesso..." />;
  if (!user && pathname !== "/admin/login") return <>{children}</>;
  if (!user && pathname === "/admin/login") return <>{children}</>;

  const getHeaderText = () => {
    const allLinks = [
        { href: '/admin', label: 'Dashboard' },
        ...navSections.flatMap(s => s.links)
    ];
    const activeLink = allLinks.find(l => pathname.startsWith(l.href));
    return activeLink?.label || "Painel Administrativo";
  }

  return (
    <div className="min-h-screen bg-[#F7FDF2]">
      <div id="admin-root" className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-[#4B4F36] text-white flex-col hidden sm:flex">
          <div className="h-20 flex items-center justify-center border-b border-gray-700/50">
            <h1 className="text-2xl font-bold">{config?.nomeFazenda || 'Painel Admin'}</h1>
          </div>
          <AdminNav />
          <div className="mt-auto p-4 space-y-2 border-t border-gray-700/50">
            <Link 
                href="/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors text-left"
            >
                <ExternalLink size={18} /> Voltar ao Site
            </Link>
            <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-500/80 hover:text-white transition-colors text-left"
            >
                <LogOut size={18} /> Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 bg-white flex items-center justify-between px-4 sm:px-8 border-b border-[#ADA192]">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-[#4B4F36] text-white border-r-0 flex flex-col">
                  <div className="h-20 flex items-center justify-center border-b border-gray-700/50">
                      <h1 className="text-2xl font-bold">{config?.nomeFazenda || 'Painel Admin'}</h1>
                  </div>
                  <AdminNav onLinkClick={() => setIsMobileMenuOpen(false)} />
                  <div className="mt-auto p-4 space-y-2 border-t border-gray-700/50">
                    <Link href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors text-left">
                        <ExternalLink size={18} /> Voltar ao Site
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-500/80 hover:text-white transition-colors text-left">
                        <LogOut size={18} /> Sair
                    </button>
                  </div>
              </SheetContent>
            </Sheet>
            
            <h2 className="text-xl sm:text-2xl font-semibold text-[#4B4F36]">{getHeaderText()}</h2>
            {user && <span className="text-sm sm:text-base text-[#ADA192]">{user.email}</span>}
          </header>
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
        </main>
      </div>
      
      <Toaster />
      {config && <ThemeInjector config={config} />}
    </div>
  );
}