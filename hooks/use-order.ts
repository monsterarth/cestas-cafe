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
  const categoryLimitPerPerson = category?.limitePorPessoa || 0

  // Aplica a lógica de limite apenas se a categoria tiver um limite configurado (maior que 0)
  if (categoryLimitPerPerson > 0 && change > 0) {
    const totalGuests = orderState.guestInfo.people
    const absoluteLimit = categoryLimitPerPerson * totalGuests

    const currentCountInCategory = category.items.reduce((total: number, currentItem: any) => {
      return total + (orderState.accompaniments[categoryId]?.[currentItem.id] || 0)
    }, 0)

    if (currentCountInCategory >= absoluteLimit) {
      toast.warning(
        `Limite atingido: máximo <span class="math-inline">\{absoluteLimit\} item\(ns\) da categoria "</span>{category.name}" para ${totalGuests} hóspede(s).`,
        {
          duration: 4000,
        },
      )
      return
    }
  }

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
