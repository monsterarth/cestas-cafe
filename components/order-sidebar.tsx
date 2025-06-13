import { User, MapPin, Users, Clock, Utensils } from "lucide-react"
import type { OrderState, HotDish, AccompanimentCategory } from "@/types"

interface OrderSidebarProps {
  orderState: OrderState
  hotDishes: HotDish[]
  accompaniments: Record<string, AccompanimentCategory>
  appConfig: AppConfig
}


export function OrderSidebar({ orderState, hotDishes, accompaniments, appConfig }: OrderSidebarProps) {  const calculateTotalCalories = () => {
    let totalCalories = 0

    // Calorias dos pratos quentes
    orderState.persons.forEach((person) => {
      if (person.hotDish?.typeId && person.hotDish.flavorId) {
        const dish = hotDishes.find((d) => d.id === person.hotDish?.typeId)
        if (dish) {
          totalCalories += dish.calorias || 0
          const flavor = dish.sabores.find((f) => f.id === person.hotDish?.flavorId)
          if (flavor) totalCalories += flavor.calorias || 0
        }
      }
    })

    // Calorias dos acompanhamentos
    Object.keys(orderState.accompaniments).forEach((catId) => {
      const itemsInCategory = orderState.accompaniments[catId]
      Object.keys(itemsInCategory).forEach((itemId) => {
        const count = itemsInCategory[itemId]
        const itemData = accompaniments[catId]?.items.find((i) => i.id === itemId)
        if (itemData && count > 0) {
          totalCalories += (itemData.calorias || 0) * count
        }
      })
    })

    return totalCalories
  }

  const totalCalories = calculateTotalCalories()
  const maxCalories = (orderState.guestInfo.people || 1) * (appConfig.caloriasMediasPorPessoa || 600)
  const caloriePercentage = maxCalories > 0 ? (totalCalories / maxCalories) * 100 : 0

  let barColor = "bg-stone-400"
  if (caloriePercentage > 20 && caloriePercentage <= 80) barColor = "bg-green-500"
  else if (caloriePercentage > 80 && caloriePercentage <= 100) barColor = "bg-yellow-500"
  else if (caloriePercentage > 100) barColor = "bg-red-500"

  const hasSelectedItems =
    orderState.persons.some((person) => person.hotDish?.typeId && person.hotDish?.flavorId) ||
    Object.values(orderState.accompaniments).some((category) => Object.values(category).some((count) => count > 0))

  return (
    <div className="sticky top-28 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
      <div className="text-white p-6 bg-[#4B4F36]">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          Sua Cesta
        </h2>
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <User className="w-4 h-4 text-stone-600" />
            <span className="text-sm">
              <strong>Hóspede:</strong> {orderState.guestInfo.name || "..."}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <MapPin className="w-4 h-4 text-stone-600" />
            <span className="text-sm">
              <strong>Cabana:</strong> {orderState.guestInfo.cabin || "..."}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <Users className="w-4 h-4 text-stone-600" />
            <span className="text-sm">
              <strong>Pessoas:</strong> {orderState.guestInfo.people || "..."}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <Clock className="w-4 h-4 text-stone-600" />
            <span className="text-sm">
              <strong>Horário:</strong> {orderState.guestInfo.time || "..."}
            </span>
          </div>
        </div>

        {/* Barra de Calorias */}
        <div className="border-t pt-4 border-[#ADA192]">
          <p className="text-sm font-medium text-stone-600 mb-2">Peso da Cesta (Estimativa)</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Total: {totalCalories} kcal / Ideal: {maxCalories} kcal
          </p>
        </div>

        <div className="border-t pt-6 border-[#ADA192]">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-[#4B4F36]">
            <Utensils className="w-4 h-4" />
            Itens Selecionados
          </h4>
          <div className="space-y-3">
            {!hasSelectedItems && <div className="text-center py-8 text-stone-500">Sua cesta está vazia.</div>}

            {/* Pratos Quentes */}
            {orderState.persons.some((person) => person.hotDish?.typeId && person.hotDish?.flavorId) && (
              <div>
                <h5 className="font-semibold text-stone-600 mb-2">Pratos Quentes</h5>
                {orderState.persons.map((person) => {
                  if (!person.hotDish?.typeId) return null

                  if (person.hotDish.typeId === "NONE") {
                    return (
                      <div key={person.id} className="text-sm p-3 bg-stone-100 border border-stone-200 rounded-lg">
                        <strong>Hóspede {person.id}:</strong> Sem prato quente
                      </div>
                    )
                  }

                  if (person.hotDish.flavorId) {
                    const dish = hotDishes.find((d) => d.id === person.hotDish.typeId)
                    const flavor = dish?.sabores?.find((f) => f.id === person.hotDish.flavorId)
                    return (
                      <div key={person.id} className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
                        <strong>Hóspede {person.id}:</strong> {dish?.emoji || ""} {flavor?.nomeSabor || ""}
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}

            {/* Acompanhamentos */}
            {Object.values(orderState.accompaniments).some((category) =>
              Object.values(category).some((count) => count > 0),
            ) && (
              <div>
                <h5 className="font-semibold text-stone-600 mb-2">Acompanhamentos</h5>
                {Object.keys(orderState.accompaniments).map((catId) => {
                  const itemsInCategory = orderState.accompaniments[catId]
                  const hasItems = Object.values(itemsInCategory).some((count) => count > 0)

                  if (!hasItems) return null

                  return (
                    <div key={catId} className="space-y-1">
                      {Object.keys(itemsInCategory).map((itemId) => {
                        const count = itemsInCategory[itemId]
                        if (count === 0) return null

                        const item = accompaniments[catId]?.items.find((i) => i.id === itemId)
                        return (
                          <div
                            key={itemId}
                            className="flex justify-between items-center text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <span>
                              {item?.emoji || ""} {item?.nomeItem}
                            </span>
                            <span className="font-bold">{count}x</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
