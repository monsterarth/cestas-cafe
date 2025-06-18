"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { OrderState } from "@/types"

export function useOrder() {
  const [orderState, setOrderState] = useState<OrderState>({
    guestInfo: {
      name: "",
      cabin: "",
      people: 0,
      time: "",
    },
    persons: [],
    accompaniments: {},
    globalHotDishNotes: "",
    specialRequests: "",
  })
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const updateOrderState = (updates: Partial<OrderState>) => {
    setOrderState((prev) => ({ ...prev, ...updates }))
  }

  const handleSelectDish = (personIndex: number, dishId: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) =>
        index === personIndex ? { ...person, hotDish: { typeId: dishId, flavorId: "" } } : person,
      ),
    }))
  }

  const handleSelectFlavor = (personIndex: number, flavorId: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) =>
        index === personIndex && person.hotDish ? { ...person, hotDish: { ...person.hotDish, flavorId } } : person,
      ),
    }))
  }

  const handleUpdateNotes = (personIndex: number, notes: string) => {
    setOrderState((prev) => ({
      ...prev,
      persons: prev.persons.map((person, index) => (index === personIndex ? { ...person, notes } : person)),
    }))
  }

  const handleNotesChange = (notes: string) => {
    setOrderState((prev) => ({ ...prev, globalHotDishNotes: notes }))
  }

  const handleUpdateAccompaniment = (categoryId: string, itemId: string, change: number, accompaniments: any) => {
    const category = accompaniments[categoryId]
    if (!category) return

    const categoryName = category.name.toLowerCase()
    const totalGuests = orderState.guestInfo.people

    // Lista de categorias com limite por item
    const itemLimitedCategories = ["bebidas", "bolos", "complementos", "frios", "frutas"]

    if (change > 0) {
      // Regra 1: Limite por item individual
      if (itemLimitedCategories.includes(categoryName)) {
        const currentItemCount = orderState.accompaniments[categoryId]?.[itemId] || 0
        if (currentItemCount >= totalGuests) {
          const item = category.items.find((i: any) => i.id === itemId)
          toast.warning(
            <div>
              Limite atingido para o item: <strong>{item?.nomeItem}</strong>
              <p className="text-xs">Cada hóspede pode selecionar até 1 unidade deste item.</p>
            </div>,
          )
          return
        }
      }

      // Regra 2: Limite total na categoria "Pães"
      if (categoryName === "pães") {
        const absoluteLimit = totalGuests * 2
        const currentCountInCategory = category.items.reduce((total: number, currentItem: any) => {
          return total + (orderState.accompaniments[categoryId]?.[currentItem.id] || 0)
        }, 0)

        if (currentCountInCategory >= absoluteLimit) {
          toast.warning(
            <div>
              Limite total da categoria <strong>Pães</strong> atingido.
              <p className="text-xs">
                Máximo de {absoluteLimit} unidades para {totalGuests} pessoa(s).
              </p>
            </div>,
          )
          return
        }
      }
    }

    // Se nenhuma regra de limite foi acionada, atualiza o estado
    setOrderState((prev) => {
      const newAccompaniments = { ...prev.accompaniments }
      if (!newAccompaniments[categoryId]) {
        newAccompaniments[categoryId] = {}
      }
      const currentCount = newAccompaniments[categoryId][itemId] || 0
      let newCount = currentCount + change
      if (newCount < 0) newCount = 0

      if (newCount === 0) {
        delete newAccompaniments[categoryId][itemId]
        if (Object.keys(newAccompaniments[categoryId]).length === 0) {
          delete newAccompaniments[categoryId]
        }
      } else {
        newAccompaniments[categoryId][itemId] = newCount
      }
      return { ...prev, accompaniments: newAccompaniments }
    })
  }

  const handleSpecialRequestsChange = (requests: string) => {
    setOrderState((prev) => ({ ...prev, specialRequests: requests }))
  }

  const handleSelectNoHotDish = (personIndex: number) => {
    setOrderState((prev) => {
      const personToUpdate = prev.persons[personIndex]
      const newHotDishState = personToUpdate?.hotDish?.typeId === "NONE" ? null : { typeId: "NONE", flavorId: "NONE" }

      return {
        ...prev,
        persons: prev.persons.map((person, index) =>
          index === personIndex ? { ...person, hotDish: newHotDishState } : person,
        ),
      }
    })
  }

  return {
    orderState,
    orderSubmitted,
    setOrderSubmitted,
    updateOrderState,
    handleSelectDish,
    handleSelectFlavor,
    handleUpdateNotes,
    handleNotesChange,
    handleUpdateAccompaniment,
    handleSpecialRequestsChange,
    handleSelectNoHotDish,
  }
}
