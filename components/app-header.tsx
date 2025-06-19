"use client"
import Link from "next/link"
import type { AppConfig } from "@/types"

interface AppHeaderProps {
  config: AppConfig
}

export function AppHeader({ config }: AppHeaderProps) {
  return (
    <header className="relative text-center py-6 md:py-8 border-b border-stone-200 bg-[#F7FDF2]">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center mb-4 h-20 md:h-24">
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logoUrl || "/placeholder.svg"}
              alt={`Logo ${config.nomeFazenda}`}
              className="h-full w-auto object-contain max-w-xs"
            />
          ) : (
            <div className="h-full w-64 md:w-80 flex items-center justify-center bg-gradient-to-r from-[#97A25F] to-[#4B4F36] text-white text-xl md:text-2xl font-bold rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-2xl md:text-3xl mb-1">🌿</div>
                <div>{config.nomeFazenda}</div>
              </div>
            </div>
          )}
        </div>
        <h1 className="text-lg md:text-xl font-semibold text-[#4B4F36] mb-1">{config.nomeFazenda}</h1>
        <p className="text-md md:text-lg text-stone-500">{config.subtitulo}</p>
      </div>
      <Link
        href="/admin"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-1 right-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
      >
        Admin Panel
      </Link>
    </header>
  )
}
