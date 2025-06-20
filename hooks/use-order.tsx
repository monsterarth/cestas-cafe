import { create } from 'zustand';
import { produce } from 'immer';
import { Comanda, Person, AccompanimentItem, AccompanimentCategory } from '@/types';
import { toast } from 'sonner';

// Define a estrutura completa do nosso estado global
export interface OrderStore {
  // Estado da Autenticação e Dados da Comanda
  isAuthenticated: boolean;
  comanda: Comanda | null;
  isLoadingAuth: boolean;
  
  // Estado do Pedido
  persons: Person[];
  accompaniments: Record<string, Record<string, number>>; // { [categoryId]: { [itemId]: count } }
  globalHotDishNotes: string;
  specialRequests: string;

  // Estado da Navegação
  currentStep: number;

  // Ações para modificar o estado
  authenticateComanda: (token: string) => Promise<boolean>;
  startOrder: () => void;
  updateAccompaniment: (categoryId: string, item: AccompanimentItem, change: number) => void;
  selectHotDish: (personIndex: number, dishId: string) => void;
  selectHotDishFlavor: (personIndex: number, flavorId: string) => void;
  selectNoHotDish: (personIndex: number) => void;
  setGlobalHotDishNotes: (notes: string) => void;
  setSpecialRequests: (notes: string) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetOrder: () => void;
}

const initialState = {
  isAuthenticated: false,
  comanda: null,
  isLoadingAuth: false,
  persons: [],
  accompaniments: {},
  globalHotDishNotes: "",
  specialRequests: "",
  currentStep: 0,
};

export const useOrder = create<OrderStore>((set, get) => ({
  ...initialState,

  // --- Ações ---

  authenticateComanda: async (token) => {
    set({ isLoadingAuth: true });
    try {
      const response = await fetch(`/api/comandas/${token}`);
      if (!response.ok) throw new Error("Comanda não encontrada");
      
      const comandaData: Comanda = await response.json();
      
      set(produce(draft => {
        draft.isAuthenticated = true;
        draft.comanda = comandaData;
        draft.currentStep = 1; // Avança para tela de confirmação
        draft.persons = Array.from({ length: comandaData.numberOfGuests }, (_, i) => ({
          id: i + 1,
          hotDish: null,
          notes: "",
        }));
      }));
      return true;
    } catch (error) {
      console.error(error);
      set({ isAuthenticated: false, comanda: null });
      return false;
    } finally {
      set({ isLoadingAuth: false });
    }
  },

  startOrder: () => set({ currentStep: 2 }), 

  updateAccompaniment: (categoryId, item, change) => {
    set(produce(draft => {
      const category = draft.accompaniments[categoryId] || {};
      const currentCount = category[item.id] || 0;
      const newCount = Math.max(0, currentCount + change); // Garante que não seja negativo
      
      if (newCount > 0) {
        category[item.id] = newCount;
      } else {
        delete category[item.id]; // Remove o item se a contagem for zero
      }

      if (Object.keys(category).length > 0) {
        draft.accompaniments[categoryId] = category;
      } else {
        delete draft.accompaniments[categoryId]; // Remove a categoria se estiver vazia
      }
    }));
  },
  
  selectHotDish: (personIndex, dishId) => {
    set(produce(draft => {
      draft.persons[personIndex].hotDish = { typeId: dishId, flavorId: null };
    }));
  },

  selectHotDishFlavor: (personIndex, flavorId) => {
    set(produce(draft => {
      if (draft.persons[personIndex].hotDish) {
        draft.persons[personIndex].hotDish!.flavorId = flavorId;
      }
    }));
  },

  selectNoHotDish: (personIndex) => {
    set(produce(draft => {
      const isAlreadyNone = get().persons[personIndex]?.hotDish?.typeId === 'NONE';
      draft.persons[personIndex].hotDish = isAlreadyNone ? null : { typeId: 'NONE', flavorId: 'NONE' };
    }));
  },

  setGlobalHotDishNotes: (notes) => set({ globalHotDishNotes: notes }),
  setSpecialRequests: (notes) => set({ specialRequests: notes }),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set(state => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set(state => ({ currentStep: state.currentStep - 1 })),
  resetOrder: () => set(initialState),
}));