"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isFirebaseAvailable } from "@/lib/firebase"
import Link from "next/link"
import { LoadingScreen } from "@/components/loading-screen"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      // Check if Firebase is available
      if (!isFirebaseAvailable()) {
        console.log("Firebase not available for admin")
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        }
        setLoading(false)
        setAuthChecked(true)
        return
      }

      try {
        // Only import and use Firebase auth when we actually need it
        const { getFirebaseAuth } = await import("@/lib/firebase")
        const auth = await getFirebaseAuth()

        if (!auth) {
          console.log("Firebase Auth not available")
          if (pathname !== "/admin/login") {
            router.push("/admin/login")
          }
          setLoading(false)
          setAuthChecked(true)
          return
        }

        // Dynamic import to avoid initialization issues
        const { onAuthStateChanged } = await import("firebase/auth")

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser)
          } else {
            // Se não há usuário logado e não está na página de login, redireciona
            if (pathname !== "/admin/login") {
              router.push("/admin/login")
            }
          }
          setLoading(false)
          setAuthChecked(true)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Failed to setup auth listener:", error)
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        }
        setLoading(false)
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      if (!isFirebaseAvailable()) {
        router.push("/admin/login")
        return
      }

      const { getFirebaseAuth } = await import("@/lib/firebase")
      const auth = await getFirebaseAuth()

      if (auth) {
        const { signOut } = await import("firebase/auth")
        await signOut(auth)
      }

      router.push("/admin/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      router.push("/admin/login")
    }
  }

  // Mostra loading enquanto verifica autenticação
  if (loading || !authChecked) {
    return <LoadingScreen message="Verificando autenticação..." />
  }

  // Se não há usuário e está na página de login, renderiza normalmente
  if (!user && pathname === "/admin/login") {
    return <>{children}</>
  }

  // Se não há usuário e não está na página de login, não renderiza nada
  // (o useEffect já vai redirecionar)
  if (!user) {
    return null
  }

  // Se há usuário logado, renderiza o layout do admin
  return (
    <div className="min-h-screen bg-[#F7FDF2]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-[#4B4F36] text-white flex flex-col">
          <div className="h-20 flex items-center justify-center border-b border-gray-700">
            <h1 className="text-2xl font-bold">Fazenda do Rosa</h1>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            <Link
              href="/admin"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${
                pathname === "/admin" ? "bg-[#97A25F]" : ""
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${
                pathname === "/admin/orders" ? "bg-[#97A25F]" : ""
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Pedidos
            </Link>

            <Link
              href="/admin/menu"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${
                pathname === "/admin/menu" ? "bg-[#97A25F]" : ""
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Cardápio
            </Link>

            <Link
              href="/admin/settings"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-[#97A25F] ${
                pathname === "/admin/settings" ? "bg-[#97A25F]" : ""
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Configurações
            </Link>
          </nav>

          <div className="mt-auto p-4 space-y-2 border-t border-gray-700">
            <Link
              href="/"
              target="_blank"
              className="flex items-center px-4 py-2 rounded-lg hover:bg-[#97A25F] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Ver Formulário
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-red-500 transition-colors text-left"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 bg-white flex items-center justify-between px-8 border-b border-[#ADA192]">
            <h2 className="text-2xl font-semibold text-[#4B4F36]">
              {pathname === "/admin" && "Dashboard"}
              {pathname === "/admin/orders" && "Pedidos"}
              {pathname === "/admin/menu" && "Cardápio"}
              {pathname === "/admin/settings" && "Configurações"}
            </h2>
            <div className="flex items-center">
              <span className="mr-4 text-[#ADA192]">{user?.email}</span>
              <div className="w-10 h-10 bg-[#E9D9CD] rounded-full flex items-center justify-center text-[#4B4F36]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
