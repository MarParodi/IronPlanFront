export type FreeActivityType =
  | 'CAMINADORA'
  | 'CAMINATA'
  | 'RUNNING'
  | 'BICICLETA_ESTATICA'
  | 'ELIPTICA'
  | 'NATACION'
  | 'BAILE'
  | 'YOGA'
  | 'FUTBOL'
  | 'BOX'
  | 'CLASE_GRUPAL'
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
