"use client"

import { CheckCircle, Heart } from "lucide-react"

export function StepSuccess() {
  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2] text-center">
      <div className="p-8 space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-green-700">Pedido Confirmado!</h2>
        <div className="space-y-4">
          <p className="text-[#4B4F36] text-lg">Sua cesta está sendo preparada com muito carinho pela nossa equipe.</p>
          <p className="text-[#4B4F36]">
            Em breve você receberá sua deliciosa cesta de café da manhã no horário solicitado.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#97A25F] font-medium">
            <Heart className="w-5 h-5 fill-current" />
            <span>Desejamos um dia maravilhoso!</span>
            <Heart className="w-5 h-5 fill-current" />
          </div>
        </div>
        <div className="pt-4 border-t border-stone-200">
          <p className="text-sm text-stone-600">
            Obrigado por escolher a Fazenda do Rosa para sua experiência gastronômica.
          </p>
        </div>
      </div>
    </div>
  )
}
