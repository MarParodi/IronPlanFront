// Modelos para el perfil de usuario

export interface ProfileHeaderDto {
  userId: number;
  username: string;
  email: string;
  trainingLevel: string | null;
  xpPoints: number;
  lifetimeXp: number;
  xpRankCode: string | null;
  xpRankLabel: string | null;
  joinedAt: string;
}

export interface ProfileStatsDto {
  totalWorkouts: number;
  totalRoutinesOwned: number;
  totalXpActions: number;
}

export interface RecentWorkoutDto {
  sessionId: number;
  routineName: string;
  date: string;
  totalSeries: number;
  totalWeightKg: number;
  durationMinutes: number;
}

export interface ProfileResponse {
  header: ProfileHeaderDto;
  stats: ProfileStatsDto;
  recentWorkouts: RecentWorkoutDto[];
}

// Hazañas/Achievements (para futuro)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// XP Ranks con sus thresholds
export const XP_RANKS: { code: string; label: string; minXp: number; maxXp: number }[] = [
  { code: 'NOVATO_I', label: 'Novato I', minXp: 0, maxXp: 999 },
  { code: 'NOVATO_II', label: 'Novato II', minXp: 1000, maxXp: 2499 },
  { code: 'NOVATO_III', label: 'Novato III', minXp: 2500, maxXp: 4999 },
  { code: 'INTERMEDIO_I', label: 'Intermedio I', minXp: 5000, maxXp: 9999 },
  { code: 'INTERMEDIO_II', label: 'Intermedio II', minXp: 10000, maxXp: 19999 },
  { code: 'INTERMEDIO_III', label: 'Intermedio III', minXp: 20000, maxXp: 34999 },
  { code: 'AVANZADO_I', label: 'Avanzado I', minXp: 35000, maxXp: 54999 },
  { code: 'AVANZADO_II', label: 'Avanzado II', minXp: 55000, maxXp: 79999 },
  { code: 'AVANZADO_III', label: 'Avanzado III', minXp: 80000, maxXp: 109999 },
  { code: 'ELITE', label: 'Elite', minXp: 110000, maxXp: 149999 },
  { code: 'MAESTRO', label: 'Maestro', minXp: 150000, maxXp: 199999 },
  { code: 'LEYENDA', label: 'Leyenda', minXp: 200000, maxXp: Infinity },
];

