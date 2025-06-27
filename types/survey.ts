// types/survey.ts
import type { Timestamp } from 'firebase/firestore';

/**
 * Define os tipos de perguntas disponíveis para uma pesquisa.
 */
export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

/**
 * Representa uma única pergunta dentro de uma pesquisa.
 */
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  options?: string[];
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
  // CORREÇÃO: Permite que 'createdAt' seja um Timestamp do Firebase (no servidor)
  // ou uma string (após ser serializado para o cliente).
  createdAt: Timestamp | string;
  questions: Question[];
}

/**
 * Representa a resposta individual de um usuário a uma pergunta específica.
 */
export interface Answer {
  id: string;
  question_snapshot: string;
  question_category_snapshot: string;
  question_type_snapshot: QuestionType;
  value: string | number | string[];
}

/**
 * Agrupa todas as respostas de um único hóspede para uma pesquisa específica.
 */
export interface SurveyResponse {
  id: string;
  surveyId: string;
  comandaId?: string;
  respondedAt: Timestamp;
  answers: Answer[];
}