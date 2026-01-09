// Modelos para hazañas/logros

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  progress: number;
}
