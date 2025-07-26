import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ThemeInjector } from "@/components/theme-injector"
import type { AppConfig } from "@/types"
import { AppFooter } from "@/components/app-footer"

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
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <head>
        <ThemeInjector config={appConfig} />
      </head>
      <body className="font-sans flex flex-col h-full">
        <main className="flex-grow">
          {children}
        </main>
        <AppFooter />
        <div id="print-container-portal" className="printable-area"></div>
      </body>
    </html>
  )
}