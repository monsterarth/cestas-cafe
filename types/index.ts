// Arquivo: types/index.ts
import { Timestamp } from 'firebase/firestore';

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  itens: ItemMenu[];
  ordem: number;
}

export interface ItemMenu {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  tipo: 'quente' | 'acompanhamento';
  disponivel: boolean;
  categoriaId: string;
}

export interface AppConfig {
  nomeFazenda?: string;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corTexto?: string;
  mensagemDoDia?: string;

  // NOVOS CAMPOS PARA MENSAGENS DO FLUXO DE PEDIDO
  welcomeEmoji?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  successGratitude?: string;
  successFooter?: string;
}

export interface Comanda {
  id: string;
  token: string;
  guestName: string;
  cabin: string;
  numberOfGuests: number;
  createdAt: Timestamp;
  horarioLimite?: Timestamp;
  status: 'ativa' | 'usada' | 'expirada' | 'arquivada';
  isActive: boolean;
  usedAt?: Timestamp;
  mensagemAtraso?: string;
  pedidoId?: string;
}

export interface ItemPedido {
  id: string;
  nomeItem: string;
  quantidade: number;
  tipo: 'quente' | 'acompanhamento';
  sabor?: string; // Para itens com variações, como sucos
}

export interface Order {
  id: string;
  comandaId: string;
  hospedeNome: string;
  cabanaNumero: string;
  numeroDePessoas: number;
  horarioEntrega: string;
  itensPedido: ItemPedido[];
  observacoes?: string;
  status: 'Novo' | 'Em Preparação' | 'Entregue' | 'Cancelado';
  timestampPedido: Timestamp;
}

export interface Cabin {
    id: string;
    name: string;
    capacity: number;
}