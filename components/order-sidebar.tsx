import { User, MapPin, Users, Utensils } from "lucide-react";
import type { OrderStore } from "@/hooks/use-order";
import type { HotDish, AccompanimentCategory } from "@/types";

interface OrderSidebarProps {
  orderState: OrderStore;
  hotDishes: HotDish[];
  accompaniments: Record<string, AccompanimentCategory>;
}

export function OrderSidebar({ orderState, hotDishes, accompaniments }: OrderSidebarProps) {
  const { comanda, persons, accompaniments: selectedAccompaniments } = orderState;

  if (!comanda) {
    return (
      <div className="sticky top-28 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center text-muted-foreground">
        Aguardando comanda...
      </div>
    );
  }

  const hasSelectedItems =
    persons.some((person) => person.hotDish) ||
    Object.values(selectedAccompaniments).some(cat => Object.values(cat).some(count => count > 0));

  return (
    <div className="sticky top-28 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
      <div className="text-white p-6 bg-[#4B4F36]">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" /> Sua Cesta
        </h2>
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <User className="w-4 h-4 text-stone-600" />
            <span className="text-sm"><strong>Hóspede:</strong> {comanda.guestName}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <MapPin className="w-4 h-4 text-stone-600" />
            <span className="text-sm"><strong>Cabana:</strong> {comanda.cabin}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <Users className="w-4 h-4 text-stone-600" />
            <span className="text-sm"><strong>Pessoas:</strong> {comanda.numberOfGuests}</span>
          </div>
        </div>

        {hasSelectedItems && (
          <div className="border-t pt-6 border-stone-200">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-[#4B4F36]"><Utensils className="w-4 h-4" />Itens Selecionados</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {/* Pratos Quentes */}
              {persons.map((person) => {
                const hotDish = person.hotDish;
                if (!hotDish) return null;
                if (hotDish.typeId === "NONE") return <div key={person.id} className="text-sm p-3 bg-stone-100 rounded-lg"><strong>Hóspede {person.id}:</strong> Sem prato quente.</div>;
                if (hotDish.typeId && hotDish.flavorId) {
                  const dish = hotDishes?.find((d) => d.id === hotDish.typeId);
                  const flavor = dish?.sabores?.find((f) => f.id === hotDish.flavorId);
                  return <div key={person.id} className="text-sm p-3 bg-green-50 rounded-lg"><strong>Hóspede {person.id}:</strong> {dish?.nomeItem} - {flavor?.nomeSabor}</div>;
                }
                return null;
              })}

              {/* Acompanhamentos */}
              {Object.entries(selectedAccompaniments).map(([catId, items]) => {
                const category = accompaniments[catId];
                if (!category) return null;
                return Object.entries(items).map(([itemId, count]) => {
                  if (count === 0) return null;
                  const item = category.items.find(i => i.id === itemId);
                  return (
                    <div key={itemId} className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded-lg">
                      <span>{item?.nomeItem}</span>
                      <span className="font-bold">{count}x</span>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}