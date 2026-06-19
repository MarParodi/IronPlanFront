export type FreeActivityType =
  | 'CAMINADORA'
  | 'RUNNING'
  | 'BICICLETA_ESTATICA'
  | 'NATACION'
  | 'OTRA';

export interface CreateFreeActivityRequest {
  activityType: FreeActivityType;
  activityTypeOther?: string | null;
  distanceKm?: number | null;
  durationSeconds: number;
  photoUrl?: string | null;
  notes?: string | null;
  caloriesEstimated?: number | null;
}

export interface FreeActivityResponse {
  id: number;
  activityType: FreeActivityType;
  activityTypeOther: string | null;
  distanceKm: number | null;
  durationSeconds: number;
  photoUrl: string | null;
  notes: string | null;
  caloriesEstimated: number;
  startedAt: string;
  completedAt: string;
}
