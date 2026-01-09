export interface RoutineDetailResponse {
  id: string | number;
  name: string;
  access: string;       // El backend devuelve "access" no "accessType"
  accessType?: string;  // Campo mapeado para uso en el template
  goal: string;
  description: string;
  suggestedLevel?: string;
  img?: string | null;
  usageCount?: number;
  xp_cost?: number;     // El backend devuelve "xp_cost"
  xpCost?: number;      // Campo mapeado para uso en el template
}
