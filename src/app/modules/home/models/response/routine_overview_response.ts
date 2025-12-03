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

export interface RoutineBlock {
  blockNumber: number;
  blockTitle: string;
  sessions: RoutineSessionOverview[];
}

export interface RoutineSessionOverview {
  sessionId: number;
  title: string;
  totalSeries: number;
  mainMuscles: string;
}
