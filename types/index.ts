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

// --- Tipos de Configuração (Unificado e Corrigido) ---
export interface AppConfig {
  logoUrl?: string;
  nomeFazenda: string;
  subtitulo?: string;
  corFundo: string;
  corTexto: string;
  corDestaque: string;
  corDestaqueTexto: string;
  corCartao: string;
  textoBoasVindas?: string;
  textoAgradecimento: string;
  mensagemAtrasoPadrao?: string;
  mensagemDoDia?: string;
  mensagensMotivacionais?: string[];
  welcomeEmoji?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  successGratitude?: string;
  successFooter?: string;
  comandaTitle?: string;
  comandaSubtitle?: string;
  comandaPostQr?: string;
  comandaFooter?: string;
  surveySuccessTitle?: string;
  surveySuccessSubtitle?: string;
  surveySuccessFooter?: string;
  preCheckInWelcomeMessage?: string;
  preCheckInSuccessMessage?: string;
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

// --- ✨ TIPOS PARA GESTÃO DE ESTOQUE ATUALIZADOS ✨ ---
export interface Supplier {
  id: string;
  name: string;
  posicao: number;
  items: StockItem[];
}

export interface StockItem {
  id: string;
  supplierId: string;
  name: string;
  posicao: number;
  inStock: number;
  toOrder: number;
  unit: string;
}

// --- ✨ NOVOS TIPOS PARA O PEDIDO DE COMPRA ATUALIZADOS ✨ ---
export interface PurchaseOrderItem {
    itemId: string;
    itemName: string;
    unit: string;
    quantity: number;
    inStock: number; // Estoque acusado no momento do pedido
}
  
export interface PurchaseOrder {
    id: string;
    createdAt: Timestamp;
    supplierId: string;
    supplierName: string;
    requestedBy: string; // Email do solicitante
    items: PurchaseOrderItem[];
    status: 'aberto' | 'concluido' | 'arquivado';
}

// --- ✨ NOVOS TIPOS PARA O PRÉ-CHECK-IN ✨ ---
export interface Guest {
  fullName: string;
  isLead: boolean;
}

export interface PreCheckIn {
  id: string;
  leadGuestCpf: string;
  leadGuestEmail: string;
  leadGuestPhone: string;
  address: string;
  estimatedArrivalTime: string;
  foodRestrictions?: string;
  isBringingPet: boolean;
  guests: Guest[];
  createdAt: string; 
  status: 'recebido' | 'concluido' | 'arquivado';
}

// --- ✨ NOVOS TIPOS PARA ESTATÍSTICAS DE COMPRA ✨ ---
export interface PurchaseStatsData {
    totalPedidosCompra: number;
    totalItensComprados: number;
    itensMaisComprados: { name: string; value: number }[];
    fornecedoresMaisAcionados: { name: string; value: number }[];
}