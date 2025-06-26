// types/survey.ts
import { Timestamp } from "firebase/firestore";

/**
 * Define os tipos de perguntas disponíveis para uma pesquisa.
 * - RATING: Uma avaliação, geralmente de 1 a 5 estrelas.
 * - TEXT: Uma resposta de texto aberta.
 * - SINGLE_CHOICE: Uma lista de opções onde apenas uma pode ser selecionada.
 * - MULTIPLE_CHOICE: Uma lista de opções onde várias podem ser selecionadas.
 */
export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

/**
 * Representa uma única pergunta dentro de uma pesquisa.
 */
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string; // Ex: "Limpeza", "Atendimento"
  options?: string[]; // Usado para SINGLE_CHOICE e MULTIPLE_CHOICE
  position: number;
}

/**
 * Representa uma pesquisa de satisfação completa.
 */
export interface Survey {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
  questions: Question[]; // As perguntas serão uma subcoleção para escalabilidade
}

/**
 * Representa a resposta individual de um usuário a uma pergunta específica.
 * Armazena um "snapshot" dos detalhes da pergunta para garantir a integridade
 * dos dados históricos, mesmo que a pergunta original seja alterada.
 */
export interface Answer {
  id: string;
  question_snapshot: string; // "Congela" o texto da pergunta
  question_category_snapshot: string; // "Congela" a categoria da pergunta
  question_type_snapshot: QuestionType; // "Congela" o tipo da pergunta
  value: string | number | string[]; // A resposta fornecida pelo usuário
}

/**
 * Agrupa todas as respostas de um único hóspede para uma pesquisa específica.
 */
export interface SurveyResponse {
  id: string;
  surveyId: string;
  comandaId?: string; // Vínculo opcional com a comanda para análises futuras
  respondedAt: Timestamp;
  answers: Answer[]; // As respostas serão uma subcoleção
}