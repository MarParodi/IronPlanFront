// Modelos para crear rutina

export type Goal = 'HIPERTROFIA' | 'FUERZA' | 'RESISTENCIA';
export type Level = 'NOVATO' | 'INTERMEDIO' | 'AVANZADO';

export interface CreateExerciseRequest {
  exerciseId: number;
  displayName?: string;
  exerciseOrder: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir?: number;
  restMinutes?: number;
}

export interface CreateSessionRequest {
  title: string;
  icon?: string;
  muscles?: string;
  description?: string;
  blockNumber: number;
  blockLabel: string;
  orderInBlock: number;
  exercises: CreateExerciseRequest[];
}

export interface CreateRoutineRequest {
  name: string;
  description: string;
  longDescription?: string;
  goal: Goal;
  suggestedLevel: Level;
  daysPerWeek: number;
  durationWeeks: number;
  img?: string;
  isPublic: boolean;
  sessions: CreateSessionRequest[];
}

export interface CreateRoutineResponse {
  id: number;
  name: string;
  message: string;
}

// Para el formulario interno
export interface SessionForm {
  id: string; // ID temporal para el frontend
  title: string;
  icon: string;
  muscles: string;
  description: string;
  exercises: ExerciseForm[];
}

export interface ExerciseForm {
  id: string; // ID temporal
  exerciseId: number | null;
  exerciseName: string;
  displayName: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restMinutes: number;
}

// Ejercicio del catálogo
export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  equipment?: string;
  description?: string;
}

