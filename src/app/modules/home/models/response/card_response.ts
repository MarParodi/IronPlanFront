// models/response/card_response.ts
export interface CardsPage {
  content: Card[];
  totalElements: number;
  totalPages: number;
  number: number;  // página actual (0-based)
  size: number;
}

export type AccessType = 'FREE' | 'XP_UNLOCK';
export type Goal = 'HYPERTROPHY' | 'STRENGTH' | 'ENDURANCE' | 'POWER' | 'FAT_LOSS' | 'MOBILITY';

export interface Card {
  id: string;
  name: string;
  img: string;        // ← usa 'image' (mapea desde 'img' del backend)
  accessType: AccessType;
  goal: Goal;
  description: string;
}
