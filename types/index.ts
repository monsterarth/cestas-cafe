// Arquivo: types/index.ts
import { Timestamp } from "firebase/firestore";

// --- Tipos de Dados do Cardápio ---
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

// --- Tipos de Configuração (Refatorado) ---
export interface AppConfig {
  // Aparência
  logoUrl?: string;
  nomeFazenda: string;
  subtitulo?: string;
  corFundo: string;
  corTexto: string;
  corDestaque: string;
  corDestaqueTexto: string;
  corCartao: string;
  // Mensagens
  textoBoasVindas?: string;
  textoAgradecimento: string;
  mensagemAtrasoPadrao?: string;
  mensagemDoDia?: string;
}

export interface Cabin {
  id: string;
  name: string;
  capacity: number;
  posicao?: number;
}

// --- Tipos de Pedidos e Comandas ---
export interface Person {
  id: number;
  hotDish: {
    typeId: string;
    flavorId: string;
  } | null;
  notes?: string;
}

export interface Comanda {
  id: string;
  guestName: string;
  cabin: string;
  numberOfGuests: number;
  token: string;
  isActive: boolean;
  status?: 'ativa' | 'arquivada';
  createdAt: Timestamp;
  usedAt?: Timestamp;
  horarioLimite?: Timestamp;
  mensagemAtraso?: string;
}

export interface OrderState {
  isAuthenticated: boolean;
  comanda: Omit<Comanda, 'id' | 'createdAt' | 'isActive' | 'usedAt'> | null;
  currentStep: number;
  completedSteps: number[];
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