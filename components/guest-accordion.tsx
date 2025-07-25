"use client"

import { useState } from "react"
import { ChevronDown, User, Check, X, ArrowLeft } from "lucide-react"
import Image from "next/image"
import type { HotDish, Person } from "@/types"
import { Button } from "@/components/ui/button"

interface GuestAccordionProps {
  persons: Person[]
  hotDishes: HotDish[]
  onSelectDish: (personIndex: number, dishId: string) => void
  onSelectFlavor: (personIndex: number, flavorId: string) => void
  onUpdateNotes: (personIndex: number, notes: string) => void
  onSelectNoHotDish: (personIndex: number) => void
}

export function GuestAccordion({
  persons,
  hotDishes,
  onSelectDish,
  onSelectFlavor,
  onSelectNoHotDish,
}: GuestAccordionProps) {
  const [openAccordions, setOpenAccordions] = useState<number[]>([0])

  const toggleAccordion = (index: number) => {
    setOpenAccordions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleSelectDish = (personIndex: number, dishId: string) => {
    onSelectDish(personIndex, dishId)
  }

  const advanceToNext = (personIndex: number) => {
    setTimeout(() => {
      setOpenAccordions((prev) => {
        const accordionsSemOAtual = prev.filter((i) => i !== personIndex)
        if (personIndex < persons.length - 1) {
          return [...accordionsSemOAtual, personIndex + 1]
        }
        return accordionsSemOAtual
      })
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }, 300)
  }

  const handleSelectFlavor = (personIndex: number, flavorId: string) => {
    onSelectFlavor(personIndex, flavorId)
    advanceToNext(personIndex)
  }

  const handleNoDishToggle = (personIndex: number) => {
    const isUndoing = persons[personIndex]?.hotDish?.typeId === "NONE"
    onSelectNoHotDish(personIndex)

    if (!isUndoing) {
      advanceToNext(personIndex)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {persons.map((person, index) => {
        const noDishSelected = person.hotDish?.typeId === "NONE"
        const isComplete = (person.hotDish?.typeId && person.hotDish?.flavorId) || noDishSelected
        const selectedDish = hotDishes.find((d) => d.id === person.hotDish?.typeId)

        return (
          <div
            key={person.id}
            className={`
              border-2 transition-all duration-200 rounded-lg
              ${isComplete ? "border-green-300 bg-green-50/50" : "border-stone-200 bg-[#F7FDF2]"}
            `}
          >
            <div
              className="cursor-pointer hover:bg-stone-50 transition-colors p-4 rounded-t-lg"
              onClick={() => toggleAccordion(index)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                    ${isComplete ? "bg-green-500 text-white" : "bg-stone-200 text-stone-600"}
                  `}
                  >
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-stone-800">Hóspede {person.id}</h3>
                    {isComplete && <p className="text-xs md:text-sm text-green-600 font-medium">Seleção completa</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span
                    className={`
                    text-xs px-2 py-1 rounded
                    ${isComplete ? "bg-green-500 text-white" : "bg-stone-200 text-stone-600"}
                  `}
                  >
                    {isComplete ? "Concluído" : "Pendente"}
                  </span>
                  <ChevronDown
                    className={`
                    w-4 h-4 md:w-5 md:h-5 transition-transform duration-200
                    ${openAccordions.includes(index) ? "rotate-180" : ""}
                  `}
                  />
                </div>
              </div>
            </div>

            <div
              className={`
                grid transition-all duration-300 ease-in-out
                ${openAccordions.includes(index) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
              `}
            >
              <div className="overflow-hidden space-y-6 md:space-y-8 p-4 md:p-6 pt-4 border-t border-stone-200">
                <div className="border-b border-stone-200 pb-6 mb-6">
                  <p className="text-sm text-stone-600 mb-2">
                    {noDishSelected
                      ? "Você optou por não receber um prato quente. Deseja escolher um agora?"
                      : "Se preferir, pule a escolha do prato quente:"}
                  </p>
                  <Button
                    variant={"outline"}
                    className={
                      noDishSelected
                        ? "border-amber-600 text-amber-800 hover:bg-amber-50 hover:text-amber-900 w-full"
                        : "border-[#ADA192] w-full"
                    }
                    onClick={() => handleNoDishToggle(index)}
                  >
                    {noDishSelected ? (
                      <>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Mudei de ideia, quero escolher um prato
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Não quero prato quente
                      </>
                    )}
                  </Button>
                </div>

                {!noDishSelected && (
                  <>
                    <div>
                      <label className="text-base md:text-lg font-bold text-stone-800 mb-4 md:mb-6 block flex items-center gap-2">
                        <span className="w-5 h-5 md:w-6 md:h-6 bg-[#97A25F] text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                          1
                        </span>
                        Qual prato quente você deseja?
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {hotDishes.map((dish) => (
                          <div
                            key={dish.id}
                            className={`
                              cursor-pointer rounded-lg p-4 md:p-6 border-2 transition-all hover:shadow-md
                              ${
                                person.hotDish?.typeId === dish.id
                                  ? "border-[#97A25F] bg-[#F7FDF2] shadow-md"
                                  : "border-[#ADA192] bg-[#F7FDF2] hover:border-[#97A25F]"
                              }
                            `}
                            onClick={() => handleSelectDish(index, dish.id)}
                          >
                            <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-3xl md:text-5xl shadow-inner bg-[#E9D9CD] overflow-hidden relative">
                                {dish.imageUrl ? (
                                  <Image
                                    src={dish.imageUrl || "/placeholder.svg"}
                                    alt={dish.nomeItem}
                                    fill
                                    className="object-cover rounded-2xl"
                                    sizes="(max-width: 768px) 80px, 112px"
                                  />
                                ) : (
                                  <span className="text-3xl md:text-5xl">{dish.emoji || "🍽️"}</span>
                                )}
                              </div>
                              <div className="space-y-2 md:space-y-3 w-full">
                                <h4 className="font-bold text-sm md:text-lg text-[#4B4F36]">{dish.nomeItem}</h4>
                                {person.hotDish?.typeId === dish.id && (
                                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center mx-auto bg-[#97A25F]">
                                    <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {person.hotDish?.typeId && selectedDish && (
                      <div className="space-y-4">
                        <label className="text-base md:text-lg font-bold text-stone-800 block flex items-center gap-2">
                          <span className="w-5 h-5 md:w-6 md:h-6 bg-[#97A25F] text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                            2
                          </span>
                          Escolha o preparo / sabor:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                          {selectedDish.sabores.map((flavor) => (
                            <div
                              key={flavor.id}
                              className={`
                                cursor-pointer rounded-lg p-3 md:p-4 border transition-all hover:shadow-sm
                                ${
                                  person.hotDish?.flavorId === flavor.id
                                    ? "border-[#97A25F] bg-[#E9D9CD]"
                                    : "border-[#ADA192] bg-[#F7FDF2] hover:border-[#97A25F]"
                                }
                              `}
                              onClick={() => handleSelectFlavor(index, flavor.id)}
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-sm md:text-base text-[#4B4F36]">
                                  {flavor.nomeSabor}
                                </h5>
                                {person.hotDish?.flavorId === flavor.id && (
                                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ml-3 bg-[#97A25F]">
                                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}