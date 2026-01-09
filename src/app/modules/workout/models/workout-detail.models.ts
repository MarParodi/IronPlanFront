export interface WorkoutSetDetailDto {
  id: number;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
  notes: string | null;
}

export interface WorkoutExerciseDetailDto {
  workoutExerciseId: number;
  exerciseOrder: number;
  exerciseName: string;
  plannedSets: number | null;
  plannedRepsMin: number | null;
  plannedRepsMax: number | null;
  plannedRir: number | null;
  plannedRestSeconds: number | null;
  status: string | null;
  completedSets: number | null;
  sets: WorkoutSetDetailDto[];
}

export interface WorkoutSessionDetailResponse {
  sessionId: number;
  routineName: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMinutes: number;
  totalSeries: number;
  totalWeightKg: number;
  xpEarned: number | null;
  exercises: WorkoutExerciseDetailDto[];
}
