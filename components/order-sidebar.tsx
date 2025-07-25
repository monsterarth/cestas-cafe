import { User, MapPin, Users, Clock, Utensils } from "lucide-react"
import type { OrderState, HotDish, AccompanimentCategory, AppConfig } from "@/types"

interface OrderSidebarProps {
  orderState: OrderState
  hotDishes: HotDish[]
  accompaniments: Record<string, AccompanimentCategory>
  appConfig: AppConfig
}

export function OrderSidebar({ orderState, hotDishes, accompaniments, appConfig }: OrderSidebarProps) {
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

        <div className="border-t pt-6 border-[#ADA192]">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-[#4B4F36]">
            <Utensils className="w-4 h-4" />
            Itens Selecionados
          </h4>
          <div className="space-y-3">
            {!hasSelectedItems && <div className="text-center py-8 text-stone-500">Sua cesta está vazia.</div>}

            {orderState.persons.some((person) => person.hotDish) && (
              <div>
                <h5 className="font-semibold text-stone-600 mb-2">Pratos Quentes</h5>
                {orderState.persons.map((person) => {
                  const hotDish = person.hotDish
                  if (!hotDish) return null

                  if (hotDish.typeId === "NONE") {
                    return (
                      <div key={person.id} className="text-sm p-3 bg-stone-100 border border-stone-200 rounded-lg mb-2">
                        <strong>Hóspede {person.id}:</strong> Sem prato quente
                      </div>
                    )
                  }

                  if (hotDish.typeId && hotDish.flavorId) {
                    const dish = hotDishes.find((d) => d.id === hotDish.typeId)
                    const flavor = dish?.sabores?.find((f) => f.id === hotDish.flavorId)
                    return (
                      <div key={person.id} className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                        <strong>Hóspede {person.id}:</strong> {dish?.emoji || ""} {dish?.nomeItem} - {flavor?.nomeSabor || ""}
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}

            {Object.values(orderState.accompaniments).some((category) =>
              Object.values(category).some((count) => count > 0),
            ) && (
              <div className="mt-4">
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