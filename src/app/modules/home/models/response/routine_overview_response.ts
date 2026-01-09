export interface RoutineOverviewResponse {
  id: number;
  name: string;
  durationWeeks: number;
  longDescription: string;
  goal: string;             // "FUERZA", "HIPERTROFIA", etc.
  recommendedLevel: string; // "NOVATO", "INTERMEDIO", etc.
  daysPerWeek: number;
  blocks: RoutineBlock[];
}

// ACTUALIZADO: Nueva estructura de bloque con más campos
export interface RoutineBlock {
  id: number;
  orderIndex: number;
  name: string;
  description: string | null;
  durationWeeks: number;
  sessions: RoutineSessionOverview[];
}

export interface RoutineSessionOverview {
  sessionId: number;
  title: string;
  totalSeries: number;
  mainMuscles: string;
}
