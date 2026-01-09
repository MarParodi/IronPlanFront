// Modelos para crear rutina

export type Goal = 'HIPERTROFIA' | 'FUERZA' | 'RESISTENCIA';
export type Level = 'NOVATO' | 'INTERMEDIO' | 'AVANZADO';
export type RoutineGender = 'MUJER' | 'HOMBRE' | 'UNISEX';

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

// ACTUALIZADO: Ahora sessionOrder en lugar de blockNumber/blockLabel/orderInBlock
export interface CreateSessionRequest {
  title: string;
  icon?: string;
  muscles?: string;
  description?: string;
  sessionOrder: number;
  exercises: CreateExerciseRequest[];
}

// NUEVO: Request para crear un bloque
export interface CreateBlockRequest {
  name: string;
  description?: string;
  orderIndex: number;
  durationWeeks: number;
  sessions: CreateSessionRequest[];
}

// ACTUALIZADO: Ahora usa blocks en lugar de sessions
export interface CreateRoutineRequest {
  name: string;
  description: string;
  longDescription?: string;
  goal: Goal;
  suggestedLevel: Level;
  daysPerWeek: number;
  durationWeeks: number;
  routineGender: RoutineGender;
  img?: string;
  isPublic: boolean;
  blocks: CreateBlockRequest[];
}

export interface CreateRoutineResponse {
  id: number;
  name: string;
  message: string;
}

// Para el formulario interno - BlockForm con sus sesiones
export interface BlockForm {
  id: string; // ID temporal para el frontend
  name: string;
  description: string;
  durationWeeks: number;
  sessions: SessionForm[];
}

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
