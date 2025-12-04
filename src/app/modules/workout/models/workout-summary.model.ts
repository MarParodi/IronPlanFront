// workout-summary.model.ts

export interface PreviousSessionComparison {
  previousSessionId: number;
  previousDate: string;
  previousDurationSeconds: number;
  previousXpEarned: number;
  durationDifferenceSeconds: number;  // positivo = tardaste más
  xpDifference: number;               // positivo = ganaste más XP
}

export interface WorkoutSessionSummaryResponse {
  sessionId: number;
  
  // Información de la sesión
  sessionTitle: string;
  sessionIcon: string | null;
  muscles: string | null;
  
  // Tiempos
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  durationFormatted: string;  // "01:23:45"
  
  // Progreso
  totalExercises: number;
  completedExercises: number;
  totalSeries: number;
  completedSeries: number;
  progressPercentage: number;
  
  // XP
  xpEarned: number;
  totalUserXp: number;
  userRank: string;
  
  // Comparación con sesión anterior
  previousComparison: PreviousSessionComparison | null;
}

