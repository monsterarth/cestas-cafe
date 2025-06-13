"use client"

import Image from "next/image"
import type { AppConfig } from "@/types"

interface AppHeaderProps {
  config: AppConfig
}

export function AppHeader({ config }: AppHeaderProps) {
  return (
    <header className="text-center py-6 md:py-8 border-b border-stone-200 bg-[#F7FDF2]">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-4">
          {config.logoUrl ? (
            <div className="relative h-20 md:h-24 w-auto max-w-xs">
              <Image
                src={config.logoUrl || "/placeholder.svg"}
                alt={`Logo ${config.nomeFazenda}`}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 200px, 300px"
              />
            </div>
          ) : (
            // Placeholder quando não há logo
            <div className="h-20 md:h-24 w-64 md:w-80 flex items-center justify-center bg-gradient-to-r from-[#97A25F] to-[#4B4F36] text-white text-xl md:text-2xl font-bold rounded-lg shadow-lg">
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
    </header>
  )
}
