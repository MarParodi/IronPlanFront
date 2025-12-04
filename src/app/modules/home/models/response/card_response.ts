// models/response/card_response.ts
export interface CardsPage {
  content: Card[];
  totalElements: number;
  totalPages: number;
  number: number;  // página actual (0-based)
  size: number;
}

export type AccessType = 'FREE' | 'XP_UNLOCK' | 'USER_SHARED';
export type Goal = 'HIPERTROFIA' | 'FUERZA' | 'RESISTENCIA';

export interface Card {
  id: string;
  name: string;
  img: string;
  accessType: AccessType;
  goal: Goal;
  description: string;
  usageCount?: number;        // Contador de veces que se ha usado la rutina
  ownerUsername?: string;     // Username del usuario que compartió la rutina (cuando accessType es USER_SHARED)
}
