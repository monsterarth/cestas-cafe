"use client"

import { useMemo } from "react"
import type { AppConfig } from "@/types"

// Função para converter Hex para HSL string (ex: "222.2 47.4% 11.2%")
const hexToHslString = (hex: string): string => {
  if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return "" // Retorna vazio se o hex for inválido
  }

  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}


interface ThemeInjectorProps {
  config: AppConfig | null
}

export function ThemeInjector({ config }: ThemeInjectorProps) {
  const cssVariables = useMemo(() => {
    if (!config) return ""

    // Fallback para cores padrão caso alguma cor não esteja definida no config
    const corFundo = config.corFundo || "#E9D9CD";
    const corTexto = config.corTexto || "#4B4F36";
    const corCartao = config.corCartao || "#F7FDF2";
    const corDestaque = config.corDestaque || "#97A25F";
    const corDestaqueTexto = config.corDestaqueTexto || "#F7FDF2";


    return `
      :root {
        --background: ${hexToHslString(corFundo)};
        --foreground: ${hexToHslString(corTexto)};
        --card: ${hexToHslString(corCartao)};
        --card-foreground: ${hexToHslString(corTexto)};
        --popover: ${hexToHslString(corCartao)};
        --popover-foreground: ${hexToHslString(corTexto)};
        --primary: ${hexToHslString(corDestaque)};
        --primary-foreground: ${hexToHslString(corDestaqueTexto)};
        --ring: ${hexToHslString(corDestaque)};
      }
    `.trim()
  }, [config])

  if (!cssVariables) return null

  return <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
}