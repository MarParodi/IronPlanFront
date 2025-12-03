// workout.models.ts

export interface WorkoutPreviousSetDto {
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutSessionProgressDto {
  sessionId: number;
  currentExerciseOrder: number;
  totalExercises: number;
  progressPercentage: number;
  xpEarned: number;
  startedAt: string; // ISO string que viene del back
}

export interface NextExerciseSummaryDto {
  workoutExerciseId: number;
  exerciseOrder: number;
  exerciseName: string;
  plannedSets: number;
  plannedRepsMin: number;
  plannedRepsMax: number;
  plannedRir: number;
  exerciseId: number | null;
  exerciseVideoUrl: string | null;
}

export interface WorkoutExerciseDetailResponse {
  sessionId: number;

  workoutExerciseId: number;
  exerciseOrder: number;

  exerciseName: string;
  plannedSets: number;
  plannedRepsMin: number;
  plannedRepsMax: number;
  plannedRir: number;
  plannedRestSeconds: number;

  exerciseId: number | null;
  exerciseVideoUrl: string | null;

  previousSet: WorkoutPreviousSetDto | null;
  progress: WorkoutSessionProgressDto;
  nextExercises: NextExerciseSummaryDto[];
}

// Para enviar las series al back
export interface WorkoutSetItemRequest {
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
}

export interface WorkoutSetRequest {
  sets: WorkoutSetItemRequest[];
  notes: string | null;
}

// Para reordenar los siguientes ejercicios
export interface ReorderNextExercisesRequest {
  workoutExerciseIds: number[];
}
