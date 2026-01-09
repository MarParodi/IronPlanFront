// Modelos para mis rutinas creadas

export interface MyRoutineItem {
  id: number;
  name: string;
  description: string;
  goal: string;
  suggestedLevel: string;
  daysPerWeek: number;
  durationWeeks: number;
  img: string | null;
  isPublic: boolean;
  status: string;
  usageCount: number;
  createdAt: string;
}

export interface MyRoutinesPage {
  content: MyRoutineItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

