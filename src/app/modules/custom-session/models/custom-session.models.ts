// Modelos para sesión personalizada

// Ejercicio del catálogo - debe coincidir con la respuesta del backend (Exercise.java)
export interface CatalogExercise {
  id: number;
  name: string;
  description?: string;
  instructions?: string;
  primaryMuscle: string;
  secondaryMuscle?: string;
  videoUrl?: string;
}

// Ejercicio seleccionado para la sesión personalizada
export interface CustomExerciseItem {
  tempId: string; // ID temporal para el frontend
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
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
