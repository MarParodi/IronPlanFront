// Modelos para el sistema de progreso y recomendaciones

// ============ TOP SET Y SETS ============

export interface TopSet {
  weightKg: number | null;
  reps: number | null;
  date: string;
}

export interface SetDetail {
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
}

// ============ HISTORIAL DE EJERCICIO ============

export interface ExerciseSessionHistory {
  workoutExerciseId: number;
  date: string;
  sessionName: string;
  volumeKg: number;
  topSet: TopSet | null;
  estimated1RM: number | null;
  totalSets: number;
  completedSets: number;
  sets: SetDetail[];
}

export interface ExerciseProgress {
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
  totalSessions: number;
  totalVolumeKg: number;
  topSet: TopSet | null;
  estimated1RM: number | null;
  history: ExerciseSessionHistory[];
}

// ============ ESTADÍSTICAS SEMANALES ============

export interface DailyWorkout {
  date: string;
  dayOfWeek: number;
  hasWorkout: boolean;
  workoutSessionId: number | null;
  sessionName: string | null;
  sets: number;
  volumeKg: number;
  minutes: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  workoutsCompleted: number;
  totalSets: number;
  totalVolumeKg: number;
  totalMinutes: number;
  dailyBreakdown: DailyWorkout[];
}

// ============ RESUMEN GENERAL ============

export interface ExercisePr {
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
  topWeight: number | null;
  topReps: number | null;
  estimated1RM: number | null;
  totalVolumeKg: number;
}

export interface ProgressSummary {
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  totalMinutes: number;
  avgWorkoutsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  topExercises: ExercisePr[];
  weeklyHistory: WeeklyStats[];
}

// ============ RECOMENDACIÓN DE PROGRESIÓN ============

export type RecommendationType = 
  | 'INCREASE_WEIGHT' 
  | 'DECREASE_WEIGHT' 
  | 'INCREASE_REPS' 
  | 'MAINTAIN' 
  | 'FIRST_TIME';

export interface RecentPerformance {
  date: string;
  weightKg: number | null;
  avgReps: number;
  completedSets: number;
  hitMaxReps: boolean;
  hitMinReps: boolean;
  volumeKg: number;
}

export interface ProgressionRecommendation {
  exerciseId: number;
  exerciseName: string;
  plannedSets: number;
  repsMin: number;
  repsMax: number;
  recentPerformance: RecentPerformance[];
  type: RecommendationType;
  message: string;
  suggestedWeightKg: number | null;
  suggestedRepsTarget: number | null;
}

// ============ 1RM CALCULATOR ============

export interface Calculate1RMRequest {
  weightKg: number;
  reps: number;
}

export interface Calculate1RMResponse {
  weightKg: number;
  reps: number;
  estimated1RM: number | null;
}
