export interface AuthReq {
  identifier: string; // o 'email' y 'password' según tu backend
  password: string;
}
export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';
export type Level = 'NOVATO' | 'INTERMEDIO' | 'AVANZADO';
export type Goal = 'HIPERTROFIA' | 'FUERZA' | 'RESISTENCIA';

export interface RegisterReq {
  email: string;
  username: string;
  password: string;
  gender: Gender;
  birthday: string;  
  level: Level;
  trainDays: number;
}

// ===== Registro multi-paso (onboarding) =====
export interface RegisterStep1Req {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterStep1Resp {
  onboardingToken: string;
  expiresAt: number;
}

export interface RegisterStep2Req {
  onboardingToken: string;
  birthday: string; // yyyy-MM-dd
  gender: Gender;
  weight?: number | null;
  height?: number | null;
  level: Level;
  trainDays: number;
  goal: Goal;
}

export interface RegisterStep3Req {
  onboardingToken: string;
  organizationCode: string;
  organizationGroup: string;
  organizationRole?: string | null;
}

export interface RegisterStep4Req {
  onboardingToken: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  consentProgramMetrics: boolean;
}

export interface AuthResp {
  token: string;
  expiresAt?: string;
  role?: 'USER' | 'ADMIN';
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}
