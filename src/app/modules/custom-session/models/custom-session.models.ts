// Modelos para sesión personalizada

// Ejercicio del catálogo (reutilizado)
export interface CatalogExercise {
  id: number;
  name: string;
  muscleGroup: string;
  equipment?: string;
  description?: string;
  videoUrl?: string;
}

// Ejercicio seleccionado para la sesión personalizada
export interface CustomExerciseItem {
  tempId: string; // ID temporal para el frontend
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restMinutes: number;
}

// Request para iniciar sesión personalizada
export interface StartCustomSessionRequest {
  title?: string;
  notes?: string;
  exercises: CustomExerciseRequest[];
}

export interface CustomExerciseRequest {
  exerciseId: number;
  orderIndex?: number;
  plannedSets: number;
  plannedRepsMin: number;
  plannedRepsMax: number;
  plannedRir: number;
  plannedRestSeconds: number;
}

// Response al iniciar sesión personalizada
export interface StartCustomSessionResponse {
  sessionId: number;
}
