export type {
  Gender,
  Goal,
  Level,
  MeResponse,
  PersonalObjective,
  WeightUnit,
} from '../../auth/models/auth.models';

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  level?: string;
  trainDays?: number;
  weight?: number | null;
  height?: number | null;
  goal?: string | null;
  personalObjective?: string | null;
  personalObjectiveOther?: string | null;
  weightUnit?: string;
  currentPassword?: string;
  newPassword?: string;
}
