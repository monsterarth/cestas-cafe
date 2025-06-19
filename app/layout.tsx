// monsterarth/cestas-cafe/cestas-cafe-vfinal/app/layout.tsx
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ThemeInjector } from "@/components/theme-injector"
import type { AppConfig } from "@/types"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

async function getAppConfig(): Promise<AppConfig | null> {
  if (!isFirebaseAvailable()) return null
  try {
    const db = await getFirebaseDb()
    if (!db) return null
    const configDoc = await getDoc(doc(db, "configuracoes", "app"))
    return configDoc.exists() ? (configDoc.data() as AppConfig) : null
  } catch (error) {
    console.error("Failed to fetch app config in layout:", error)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig()
  const title = config?.nomeFazenda ? `${config.nomeFazenda} - Cestas de Café` : "Cestas de Café da Manhã"
  const description = config?.subtitulo || "Personalize sua cesta de café da manhã"
  
  return { title, description, generator: "v0.dev" }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const appConfig = await getAppConfig()

  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        {/* O injetor de tema aplica as cores customizadas, isso está correto */}
        <ThemeInjector config={appConfig} />
      </head>
      {/* O body deve conter apenas os 'children' para que cada rota defina seu próprio layout */}
      <body className="font-sans">{children}</body>
    </html>
  )
}