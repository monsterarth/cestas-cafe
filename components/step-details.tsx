"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Cabin, OrderState } from "@/types"

interface StepDetailsProps {
  orderState: OrderState
  cabins: Cabin[] // Alterado de Record para Array
  deliveryTimes: string[]
  onUpdateOrderState: (updates: Partial<OrderState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDetails({
  orderState,
  cabins,
  deliveryTimes,
  onUpdateOrderState,
  onNext,
  onBack,
}: StepDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {}

    if (!orderState.guestInfo.name.trim()) {
      newErrors.name = "Insira seu nome."
    }
    if (!orderState.guestInfo.cabin) {
      newErrors.cabin = "Selecione a cabana."
    }
    if (!orderState.guestInfo.people || orderState.guestInfo.people === 0) {
      newErrors.people = "Selecione o nº de pessoas."
    }
    if (!orderState.guestInfo.time) {
      newErrors.time = "Selecione um horário."
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  const handleCabinChange = (cabinName: string) => {
    const selectedCabin = cabins.find(c => c.name === cabinName) || null;
    onUpdateOrderState({
      guestInfo: {
        ...orderState.guestInfo,
        cabin: cabinName,
        people: 0, 
      },
      persons: [],
    })
    setErrors({ ...errors, cabin: "" })
  }

  const handlePeopleChange = (people: number) => {
    const persons = Array.from({ length: people }, (_, i) => ({
      id: i + 1,
      hotDish: null,
      notes: "",
    }))

    onUpdateOrderState({
      guestInfo: {
        ...orderState.guestInfo,
        people,
      },
      persons,
    })
    setErrors({ ...errors, people: "" })
  }

  const selectedCabin = cabins.find(c => c.name === orderState.guestInfo.cabin);
  const maxCapacity = selectedCabin?.capacity || 0

  return (
    <div className="shadow-lg border-0 rounded-lg overflow-hidden bg-[#F7FDF2]">
      <div className="text-white p-4 md:p-6 bg-[#97A25F]">
        <h1 className="text-xl md:text-2xl font-bold">Detalhes da Reserva</h1>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <Label htmlFor="guest-name" className="text-sm font-medium text-[#4B4F36] mb-1">
            Seu Nome Completo
          </Label>
          <Input
            id="guest-name"
            type="text"
            value={orderState.guestInfo.name}
            onChange={(e) => {
              onUpdateOrderState({
                guestInfo: { ...orderState.guestInfo, name: e.target.value },
              })
              setErrors({ ...errors, name: "" })
            }}
            placeholder="Nome do responsável pela reserva"
            className={`border-[#ADA192] bg-[#F7FDF2] focus:border-[#97A25F] ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cabin-number" className="text-sm font-medium text-[#4B4F36] mb-1">
              Nº da Cabana
            </Label>
            <select
              id="cabin-number"
              value={orderState.guestInfo.cabin}
              onChange={(e) => handleCabinChange(e.target.value)}
              className={`w-full p-3 border rounded-lg bg-[#F7FDF2] focus:ring-2 focus:ring-[#97A25F] focus:border-[#97A25F] transition ${
                errors.cabin ? "border-red-500" : "border-[#ADA192]"
              }`}
            >
              <option value="">Selecione...</option>
              {cabins.map((cabin) => (
                <option key={cabin.name} value={cabin.name}>
                  {cabin.name}
                </option>
              ))}
            </select>
            {errors.cabin && <p className="text-red-600 text-sm mt-1">{errors.cabin}</p>}
          </div>

          <div>
            <Label htmlFor="number-of-people" className="text-sm font-medium text-[#4B4F36] mb-1">
              Nº de Pessoas
            </Label>
            <select
              id="number-of-people"
              value={orderState.guestInfo.people || ""}
              onChange={(e) => handlePeopleChange(Number.parseInt(e.target.value, 10) || 0)}
              disabled={!selectedCabin}
              className={`w-full p-3 border rounded-lg bg-[#F7FDF2] focus:ring-2 focus:ring-[#97A25F] focus:border-[#97A25F] transition ${
                errors.people ? "border-red-500" : "border-[#ADA192]"
              } ${!selectedCabin ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">{selectedCabin ? "Selecione..." : "Selecione a cabana"}</option>
              {selectedCabin &&
                Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} Pessoa{num > 1 ? "s" : ""}
                  </option>
                ))}
            </select>
            {errors.people && <p className="text-red-600 text-sm mt-1">{errors.people}</p>}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#4B4F36] mb-2">Horário de Entrega</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {deliveryTimes.map((time) => (
              <label
                key={time}
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  orderState.guestInfo.time === time
                    ? "border-[#97A25F] bg-[#E9D9CD]"
                    : "border-[#ADA192] bg-[#F7FDF2] hover:border-[#97A25F]"
                }`}
              >
                <input
                  type="radio"
                  name="delivery-time"
                  value={time}
                  checked={orderState.guestInfo.time === time}
                  onChange={(e) => {
                    onUpdateOrderState({
                      guestInfo: { ...orderState.guestInfo, time: e.target.value },
                    })
                    setErrors({ ...errors, time: "" })
                  }}
                  className="sr-only"
                />
                <span className="font-medium text-[#4B4F36]">{time}</span>
              </label>
            ))}
          </div>
          {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time}</p>}
        </fieldset>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
          <Button variant="outline" onClick={onBack} className="border-[#ADA192] text-[#4B4F36] hover:bg-[#E9D9CD]">
            ← Voltar
          </Button>
          <Button onClick={validateAndNext} className="bg-[#97A25F] hover:bg-[#97A25F]/90 text-white">
            Próximo →
          </Button>
        </div>
      </div>
    </div>
  )
}
