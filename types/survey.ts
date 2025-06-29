// types/survey.ts
import type { Timestamp } from 'firebase/firestore';

export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NPS' | 'SECTION_BREAK';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  description?: string;
  options?: string[];
  position: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp | string;
  questions: Question[];
}

export interface Answer {
  id: string;
  question_snapshot: string;
  question_category_snapshot: string;
  question_type_snapshot: QuestionType;
  value: string | number | string[];
}

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

export interface SurveyResponse {
  id: string;
  surveyId: string;
  comandaId?: string;
  respondedAt: Timestamp;
  answers: Answer[];
  context?: SurveyResponseContext;
}