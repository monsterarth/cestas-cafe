// types/survey.ts
import type { Timestamp } from 'firebase/firestore';

<<<<<<< HEAD
/**
 * Define os tipos de perguntas disponíveis para uma pesquisa.
 */
export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

/**
 * Representa uma única pergunta dentro de uma pesquisa.
 */
=======
export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NPS' | 'SECTION_BREAK';

>>>>>>> codigo-novo/main
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
<<<<<<< HEAD
=======
  description?: string;
>>>>>>> codigo-novo/main
  options?: string[];
  position: number;
}

<<<<<<< HEAD
/**
 * Representa uma pesquisa de satisfação completa.
 */
=======
>>>>>>> codigo-novo/main
export interface Survey {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
<<<<<<< HEAD
  // CORREÇÃO: Permite que 'createdAt' seja um Timestamp do Firebase (no servidor)
  // ou uma string (após ser serializado para o cliente).
=======
>>>>>>> codigo-novo/main
  createdAt: Timestamp | string;
  questions: Question[];
}

<<<<<<< HEAD
/**
 * Representa a resposta individual de um usuário a uma pergunta específica.
 */
=======
>>>>>>> codigo-novo/main
export interface Answer {
  id: string;
  question_snapshot: string;
  question_category_snapshot: string;
  question_type_snapshot: QuestionType;
  value: string | number | string[];
}

<<<<<<< HEAD
/**
 * Agrupa todas as respostas de um único hóspede para uma pesquisa específica.
 */
=======
// ATUALIZAÇÃO: Adicionando os novos campos de localização
export interface SurveyResponseContext {
  cabinName?: string;
  guestCount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  country?: string;
  state?: string;
  city?: string;
}

>>>>>>> codigo-novo/main
export interface SurveyResponse {
  id: string;
  surveyId: string;
  comandaId?: string;
  respondedAt: Timestamp;
  answers: Answer[];
<<<<<<< HEAD
=======
  context?: SurveyResponseContext;
}
export interface GeneratedSurveyLink {
    id: string;
    surveyId: string;
    fullUrl: string;
    context: SurveyResponseContext;
    createdAt: Timestamp | string;
>>>>>>> codigo-novo/main
}