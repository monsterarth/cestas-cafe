export interface HotDish {
  id: string
  nomeItem: string
  emoji?: string
  disponivel: boolean
  sabores: Flavor[]
  imageUrl?: string
  posicao?: number
}

export interface Flavor {
  id: string
  nomeSabor: string
  disponivel: boolean
  posicao: number // O campo 'posicao' é necessário aqui
}

export interface Person {
  id: number
  hotDish: {
    typeId: string
    flavorId: string
  } | null
  notes?: string
}

export interface Cabin {
  name: string
  capacity: number
}

export interface AccompanimentCategory {
  id: string
  name: string
  items: AccompanimentItem[]
  // 'limitePorPessoa' foi removido daqui pois a lógica agora é fixa no código
}

export interface AccompanimentItem {
  id: string
  nomeItem: string
  emoji?: string
  disponivel: boolean
  descricaoPorcao?: string
}

export interface AppConfig {
  logoUrl?: string
  nomeFazenda: string
  subtitulo: string
  textoIntroducao: string
  textoAgradecimento: string
  corFundo: string
  corTexto: string
  corDestaque: string
  corDestaqueTexto: string
  corCartao: string
}

export interface OrderState {
  guestInfo: {
    name: string
    cabin: string
    people: number
    time: string
  }
  persons: Person[]
  accompaniments: Record<string, Record<string, number>>
  globalHotDishNotes: string
  specialRequests: string
}