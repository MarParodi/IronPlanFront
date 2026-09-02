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

export const FREE_ACTIVITY_TYPE_LABELS: Record<FreeActivityType, string> = {
  CAMINADORA: 'Caminadora',
  CAMINATA: 'Caminata',
  RUNNING: 'Running',
  BICICLETA_ESTATICA: 'Bicicleta estática',
  ELIPTICA: 'Elíptica',
  NATACION: 'Natación',
  BAILE: 'Baile',
  YOGA: 'Yoga',
  FUTBOL: 'Fútbol',
  BOX: 'Box',
  CLASE_GRUPAL: 'Clase grupal',
  OTRA: 'Otra',
};

export function getFreeActivityLabel(type: FreeActivityType, other?: string | null): string {
  if (type === 'OTRA' && other?.trim()) return other.trim();
  return FREE_ACTIVITY_TYPE_LABELS[type] ?? type;
}
