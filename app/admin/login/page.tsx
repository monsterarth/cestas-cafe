"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isFirebaseAvailable } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@fazenda.com")
  const [password, setPassword] = useState("123456")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkExistingAuth = async () => {
      // Check if Firebase is available
      if (!isFirebaseAvailable()) {
        setError("Firebase não está configurado. Verifique as variáveis de ambiente.")
        return
      }

      try {
        const { getFirebaseAuth } = await import("@/lib/firebase")
        const auth = await getFirebaseAuth()

        if (!auth) {
          setError("Serviço de autenticação não disponível.")
          return
        }

        // Se o usuário já estiver logado, redireciona para o dashboard
        const { onAuthStateChanged } = await import("firebase/auth")
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            router.push("/admin")
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Failed to setup auth listener:", error)
        setError("Erro ao configurar autenticação.")
      }
    }

    checkExistingAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!isFirebaseAvailable()) {
      setError("Firebase não está configurado.")
      setIsLoading(false)
      return
    }

    try {
      const { getFirebaseAuth } = await import("@/lib/firebase")
      const auth = await getFirebaseAuth()

      if (!auth) {
        setError("Serviço de autenticação não disponível.")
        setIsLoading(false)
        return
      }

      const { signInWithEmailAndPassword } = await import("firebase/auth")
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/admin")
    } catch (error: any) {
      console.error("Erro no login:", { code: error.code, message: error.message })
      let errorMessage = "Ocorreu um erro inesperado. Tente novamente."
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Nenhum usuário encontrado com este e-mail."
          break
        case "auth/wrong-password":
          errorMessage = "A senha está incorreta. Verifique e tente novamente."
          break
        case "auth/invalid-email":
          errorMessage = "O formato do e-mail é inválido."
          break
        case "auth/too-many-requests":
          errorMessage = "Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde."
          break
        default:
          errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha."
          break
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#E9D9CD]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#4B4F36] mb-2">Painel Administrativo</h2>
          <p className="text-[#ADA192]">Fazenda do Rosa</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-[#4B4F36] font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 border-[#ADA192] focus:border-[#97A25F] focus:ring-[#97A25F]"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#4B4F36] font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border-[#ADA192] focus:border-[#97A25F] focus:ring-[#97A25F]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#97A25F] hover:bg-[#97A25F]/90 text-white font-medium py-2 px-4 rounded-lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#ADA192] hover:text-[#97A25F] transition-colors">
            ← Voltar ao site principal
          </a>
        </div>
      </div>
    </div>
  )
}
