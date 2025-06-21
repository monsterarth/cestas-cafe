// Arquivo: components/step-review.tsx
'use client';

import { Button } from "@/components/ui/button";
// CORREÇÃO: Adicionado CardFooter à importação
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { OrderState, HotDish, AccompanimentCategory, ItemPedido, Person } from "@/types";
import { useOrder } from "@/hooks/use-order";
// CORREÇÃO: Adicionada a importação do Label
import { Label } from "@/components/ui/label";

interface StepReviewProps {
  orderState: OrderState;
  hotDishes: HotDish[];
  accompaniments: Record<string, AccompanimentCategory>;
  onBack: () => void;
  onSuccess: () => void;
  onUpdateSpecialRequests: (requests: string) => void;
  onNavigateToStep: (step: number) => void;
}

export function StepReview({ orderState, hotDishes, accompaniments, onBack, onSuccess, onUpdateSpecialRequests, onNavigateToStep }: StepReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetOrder } = useOrder();

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    const itemsDoPedido: ItemPedido[] = [];

    orderState.persons.forEach((p: Person, index: number) => {
      if (p.hotDish && p.hotDish.typeId !== 'NONE') {
        const dish = hotDishes.find(hd => hd.id === p.hotDish?.typeId);
        const flavor = dish?.sabores.find(f => f.id === p.hotDish?.flavorId);
        
        itemsDoPedido.push({
          nomeItem: dish?.nomeItem || 'Prato não encontrado',
          sabor: flavor?.nomeSabor || 'Sabor não encontrado',
          quantidade: 1,
          categoria: 'Prato Quente',
          paraPessoa: `Hóspede ${index + 1}`
        });
      }
    });

    Object.entries(orderState.accompaniments).forEach(([categoryId, items]) => {
      const category = accompaniments[categoryId];
      Object.entries(items).forEach(([itemId, quantity]) => {
        const item = category?.items.find(i => i.id === itemId);
        if (item) {
          itemsDoPedido.push({
            nomeItem: item.nomeItem,
            quantidade: quantity,
            categoria: category.name,
          });
        }
      });
    });

    try {
      const db = await getFirebaseDb();
      if (!db) throw new Error("Falha ao conectar com o banco de dados.");

      await addDoc(collection(db, "orders"), {
        hospedeNome: orderState.guestInfo.name,
        cabanaNumero: orderState.guestInfo.cabin,
        numeroPessoas: orderState.guestInfo.people,
        horarioEntrega: orderState.guestInfo.time,
        itensPedido: itemsDoPedido,
        observacoesGerais: orderState.specialRequests,
        observacoesPratosQuentes: orderState.globalHotDishNotes,
        status: "Novo",
        timestampPedido: serverTimestamp(),
      });

      toast.success("Pedido enviado com sucesso!");
      resetOrder();
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao enviar pedido:", error);
      toast.error(error.message || "Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHotDishName = (person: Person) => {
    if (!person.hotDish || person.hotDish.typeId === 'NONE') return "Nenhum prato quente selecionado";
    const dish = hotDishes.find(hd => hd.id === person.hotDish?.typeId);
    if (!dish) return "Prato inválido";
    const flavor = dish.sabores.find(f => f.id === person.hotDish?.flavorId);
    return `${dish.nomeItem} (${flavor?.nomeSabor || 'sem sabor'})`;
  };

  const allHotDishesSelected = orderState.persons.every(p => p.hotDish !== null);

  return (
     <Card className="shadow-lg border-0 rounded-lg overflow-hidden bg-card">
        <CardHeader>
          <CardTitle>Revisão do Pedido</CardTitle>
          <CardDescription>Confira todos os itens selecionados antes de enviar para a cozinha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalhes da Entrega <Button variant="link" size="sm" onClick={() => onNavigateToStep(2)}>(editar)</Button></h3>
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg space-y-1">
                    <p><strong>Hóspede:</strong> {orderState.guestInfo.name}</p>
                    <p><strong>Cabana:</strong> {orderState.guestInfo.cabin}</p>
                    <p><strong>Horário:</strong> {orderState.guestInfo.time}</p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pratos Quentes ({orderState.persons.length}) <Button variant="link" size="sm" onClick={() => onNavigateToStep(3)}>(editar)</Button></h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {orderState.persons.map((person: Person) => (
                        <li key={person.id}>
                            <strong>Hóspede {person.id}:</strong> {getHotDishName(person)}
                        </li>
                    ))}
                </ul>
                {orderState.globalHotDishNotes && (
                    <p className="text-xs italic text-muted-foreground border-l-2 pl-2"><strong>Obs:</strong> {orderState.globalHotDishNotes}</p>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Acompanhamentos <Button variant="link" size="sm" onClick={() => onNavigateToStep(4)}>(editar)</Button></h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {Object.keys(orderState.accompaniments).length > 0 ? (
                    Object.entries(orderState.accompaniments).flatMap(([catId, items]) =>
                        Object.entries(items).map(([itemId, quantity]) => {
                            const category = accompaniments[catId];
                            const item = category?.items.find(i => i.id === itemId);
                            return <li key={`${catId}-${itemId}`}>{quantity}x {item?.nomeItem}</li>
                        })
                    )
                ) : (
                    <li>Nenhum acompanhamento selecionado.</li>
                )}
                </ul>
            </div>

             <div className="space-y-3 pt-6 border-t">
                <Label className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Observações Gerais do Pedido
                </Label>
                <Textarea
                    placeholder="Alguma observação geral, pedido especial ou informação sobre alergias?"
                    value={orderState.specialRequests}
                    onChange={(e) => onUpdateSpecialRequests(e.target.value)}
                    className="resize-none"
                    rows={4}
                />
            </div>

        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>← Voltar</Button>
            <Button onClick={handleSubmitOrder} disabled={isSubmitting || !allHotDishesSelected}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Pedido
            </Button>
        </CardFooter>
    </Card>
  );
}