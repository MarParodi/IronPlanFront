export interface AuthReq {
  identifier: string; // o 'email' y 'password' según tu backend
  password: string;
}
export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';
export type Level = 'NOVATO' | 'INTERMEDIO' | 'AVANZADO';

export interface RegisterReq {
  email: string;
  username: string;
  password: string;
  gender: Gender;
  birthday: string;  
  level: Level;
  trainDays: number;
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
