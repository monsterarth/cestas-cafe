// cestas-cafe/hooks/use-order.tsx
'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import type { OrderState, Person, Comanda, AccompanimentCategory } from '@/types';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface OrderActions {
    // CORREÇÃO: A função agora espera o objeto 'Comanda' completo.
    setAuthenticated: (comandaData: Comanda) => void;
    updateGuestInfo: (updates: Partial<OrderState['guestInfo']>) => void;
    setStep: (step: number) => void;
    handleSelectDish: (personIndex: number, dishId: string) => void;
    handleSelectFlavor: (personIndex: number, flavorId: string) => void;
    handleSelectNoHotDish: (personIndex: number) => void;
    handleNotesChange: (notes: string) => void;
    handleUpdateAccompaniment: (categoryId: string, itemId: string, change: number, accompanimentsData: Record<string, AccompanimentCategory>) => void;
    handleSpecialRequestsChange: (requests: string) => void;
    resetOrder: () => void;
}

const initialState: OrderState = {
    isAuthenticated: false,
    comanda: null,
    currentStep: 0,
    completedSteps: [],
    guestInfo: { name: '', cabin: '', people: 0, time: '' },
    persons: [],
    accompaniments: {},
    globalHotDishNotes: '',
    specialRequests: '',
};

export const useOrderStore = create<OrderState & OrderActions>((set, get) => ({
    ...initialState,

    setAuthenticated: (comandaData) => {
        const persons = Array.from({ length: comandaData.numberOfGuests }, (_, i) => ({
            id: i + 1,
            hotDish: null,
            notes: "",
        }));

        set({
            isAuthenticated: true,
            comanda: comandaData,
            currentStep: 1,
            completedSteps: [1],
            guestInfo: {
                name: comandaData.guestName,
                cabin: comandaData.cabin,
                people: comandaData.numberOfGuests,
                time: '',
            },
            persons,
        });
    },
    
    updateGuestInfo: (updates) => {
        set((state) => ({
            guestInfo: { ...state.guestInfo, ...updates }
        }));
    },

    setStep: (step) => {
        set((state) => ({
            currentStep: step,
            completedSteps: [...new Set([...state.completedSteps, step])]
        }));
    },

    handleSelectDish: (personIndex, dishId) => {
        set((state) => ({
            persons: state.persons.map((person, index) =>
                index === personIndex ? { ...person, hotDish: { typeId: dishId, flavorId: '' } } : person
            ),
        }));
    },

    handleSelectFlavor: (personIndex, flavorId) => {
        set((state) => ({
            persons: state.persons.map((person, index) =>
                index === personIndex && person.hotDish ? { ...person, hotDish: { ...person.hotDish, flavorId } } : person
            ),
        }));
    },

    handleSelectNoHotDish: (personIndex) => {
        set((state) => {
            const personToUpdate = state.persons[personIndex];
            const newHotDishState = personToUpdate?.hotDish?.typeId === 'NONE' ? null : { typeId: 'NONE', flavorId: 'NONE' };
            return {
                persons: state.persons.map((person, index) =>
                    index === personIndex ? { ...person, hotDish: newHotDishState } : person
                ),
            };
        });
    },
    
    handleNotesChange: (notes) => set({ globalHotDishNotes: notes }),
    
    handleSpecialRequestsChange: (requests) => set({ specialRequests: requests }),

    handleUpdateAccompaniment: (categoryId, itemId, change, accompanimentsData) => {
        const { guestInfo, accompaniments: currentAccompaniments } = get();
        const category = accompanimentsData[categoryId];
        if (!category) return;

        const categoryName = category.name.toLowerCase();
        const totalGuests = guestInfo.people;
        const itemLimitedCategories = ["bebidas", "bolos", "complementos", "frios", "frutas"];

        if (change > 0) {
            if (itemLimitedCategories.includes(categoryName)) {
                const currentItemCount = currentAccompaniments[categoryId]?.[itemId] || 0;
                if (currentItemCount >= totalGuests) {
                    const item = category.items.find((i) => i.id === itemId);
                    toast.warning(
                        <div>Limite atingido para o item: <strong>{item?.nomeItem}</strong><p className="text-xs">Cada hóspede pode selecionar até 1 unidade deste item.</p></div>
                    );
                    return;
                }
            }
            if (categoryName === "pães") {
                const absoluteLimit = totalGuests * 2;
                const currentCountInCategory = Object.values(currentAccompaniments[categoryId] || {}).reduce((total: number, count: number) => total + count, 0);
                if (currentCountInCategory >= absoluteLimit) {
                    toast.warning(
                        <div>Limite total da categoria <strong>Pães</strong> atingido.<p className="text-xs">Máximo de {absoluteLimit} unidades para {totalGuests} pessoa(s).</p></div>
                    );
                    return;
                }
            }
        }
        
        set((state) => {
            const newAccompaniments = { ...state.accompaniments };
            if (!newAccompaniments[categoryId]) newAccompaniments[categoryId] = {};
            
            let newCount = (newAccompaniments[categoryId][itemId] || 0) + change;
            if (newCount < 0) newCount = 0;

            if (newCount === 0) {
                delete newAccompaniments[categoryId][itemId];
                if (Object.keys(newAccompaniments[categoryId]).length === 0) {
                    delete newAccompaniments[categoryId];
                }
            } else {
                newAccompaniments[categoryId][itemId] = newCount;
            }
            return { accompaniments: newAccompaniments };
        });
    },
    
    resetOrder: () => set(initialState),
}));

export const useOrder = useOrderStore;

export const deactivateComanda = async (token: string) => {
    console.log(`Lógica de desativação por uso da comanda '${token}' foi pulada conforme solicitado.`);
    return;
};