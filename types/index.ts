// Arquivo: types/index.ts

import { Timestamp } from "firebase/firestore";

export interface HotDish {
  id: string;
  nomeItem: string;
  emoji?: string;
  disponivel: boolean;
  sabores: Flavor[];
  imageUrl?: string;
  posicao?: number;
}

export interface Flavor {
  id:string;
  nomeSabor: string;
  disponivel: boolean;
  posicao: number;
}

export interface Person {
  id: number;
  hotDish: {
    typeId: string;
    flavorId: string;
  } | null;
  notes?: string;
}

export interface Cabin {
  name: string;
  capacity: number;
}

export interface AccompanimentCategory {
  id: string;
  name: string;
  items: AccompanimentItem[];
}

export interface AccompanimentItem {
  id: string;
  nomeItem: string;
  emoji?: string;
  disponivel: boolean;
  descricaoPorcao?: string;
}

export interface AppConfig {
  logoUrl?: string;
  nomeFazenda: string;
  subtitulo: string;
  textoBoasVindas: string;
  corFundo: string;
  corTexto: string;
  corDestaque: string;
  corDestaqueTexto: string;
  corCartao: string;
  mensagensMotivacionais?: string[];
}

export interface Comanda {
  id: string; // Document ID from Firestore
  guestName: string;
  cabin: string;
  numberOfGuests: number;
  token: string;
  isActive: boolean;
  createdAt: Timestamp;
  usedAt?: Timestamp;
  horarioLimite?: Timestamp; // NOVO
  mensagemAtraso?: string;   // NOVO
}

export interface OrderState {
  guestInfo: {
    name: string;
    cabin: string;
    people: number;
    time: string;
  };
  persons: Person[];
  accompaniments: Record<string, Record<string, number>>;
  globalHotDishNotes: string;
  specialRequests: string;
  
  // --- Adições para o fluxo de Comanda/Autenticação ---
  isAuthenticated: boolean;
  comanda: Omit<Comanda, 'id' | 'createdAt' | 'isActive' | 'usedAt'> | null;
  currentStep: number;
  completedSteps: number[];
}

export interface ItemPedido {
  nomeItem: string;
  quantidade: number;
  observacao?: string;
  paraPessoa?: string;
  categoria?: string;
  sabor?: string;
}

export interface Order {
  id: string;
  hospedeNome: string;
  cabanaNumero: string;
  horarioEntrega: string;
  numeroPessoas: number;
  status: "Novo" | "Em Preparação" | "Entregue" | "Cancelado";
  timestampPedido: Timestamp;
  itensPedido: ItemPedido[];
  observacoesGerais?: string;
  observacoesPratosQuentes?: string;
}