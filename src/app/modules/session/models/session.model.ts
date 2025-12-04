// src/app/features/academia/models/session.model.ts
export interface SessionExercise {
  id: number;
  exerciseId: number;
  name: string;
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  restMinutes: number;
}

export interface TrainingSessionDetail {
  id: number;
  routineId: number;
  title: string;
  icon: string | null;
  muscles: string;
  description: string;
  totalSeries: number;
  estimatedMinutes: number;
  estimatedXp: number;
  exercises: SessionExercise[];
}
