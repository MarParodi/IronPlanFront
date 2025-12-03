export interface RoutineDetailResponse {
  id: string;
  name: string;
  accessType: string;
  goal: string;
  description: string;
  suggestedLevel?: string;
  img?: string;
  usageCount?: number;
}
