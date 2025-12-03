// services/home.services.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardsPage, Card } from '../models/response/card_response';
import { RoutineDetailResponse } from '../models/response/detail_routine_response';
import { RoutineOverviewResponse } from '../models/response/routine_overview_response';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCardsPage(params: { page?: number; size?: number; sort?: string; goal?: string; search?: string; daysPerWeek?: number }): Observable<CardsPage> {
    const { page = 0, size = 12, sort = 'name,asc', goal, search, daysPerWeek } = params ?? {};
    const url = `${this.baseUrl}/routines`;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (goal) query.set('goal', goal);
    if (search) query.set('search', search);
    if (daysPerWeek) query.set('daysPerWeek', String(daysPerWeek));

    return this.http.get<any>(`${url}?${query.toString()}`).pipe(
      map(p => ({
        ...p,
        content: (p.content ?? []).map((r: any): Card => ({
          id: String(r.id),
          name: r.name,
          img: r.img,
          accessType: r.accessType,
          goal: r.goal,
          description: r.description,
          usageCount: r.usageCount ?? 0,
          ownerUsername: r.ownerUsername   // Username del creador (cuando es USER_SHARED)
        }))
      }))
    );
  }


  getRoutineDetail(id: string): Observable<RoutineDetailResponse> {
  const url = `${this.baseUrl}/routines/${id}`;
  return this.http.get<RoutineDetailResponse>(url);
}

  getRoutineOverview(id: string | number): Observable<RoutineOverviewResponse> {
    return this.http.get<RoutineOverviewResponse>(
      `${this.baseUrl}/routines/${id}/overview`
    );
  }

  // -------- RUTINA DEL USUARIO --------

  /**
   * Empezar/asignar una rutina al usuario actual
   */
  startRoutine(routineId: number | string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/profile/start-routine`, {
      routineId: Number(routineId)
    });
  }

  /**
   * Dejar la rutina actual
   */
  stopRoutine(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/profile/stop-routine`, {});
  }

  /**
   * Obtener la rutina actual del usuario (básico)
   */
  getCurrentRoutine(): Observable<CurrentRoutineResponse | null> {
    return this.http.get<CurrentRoutineResponse>(`${this.baseUrl}/profile/my-routine`);
  }

  /**
   * Obtener la rutina activa con progreso completo (para la pantalla Mi Rutina)
   */
  getActiveRoutineWithProgress(): Observable<ActiveRoutineResponse> {
    return this.http.get<ActiveRoutineResponse>(`${this.baseUrl}/profile/my-routine/full`);
  }

  /**
   * Reordenar sesiones dentro de un bloque
   */
  reorderSessions(routineId: number, blockNumber: number, sessionIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/profile/my-routine/reorder`, {
      routineId,
      blockNumber,
      sessionIds
    });
  }
}

// Interfaces para rutina activa con progreso
export interface ActiveRoutineResponse {
  id: number;
  name: string;
  durationWeeks: number;
  daysPerWeek: number;
  totalSessions: number;
  completedSessions: number;
  progressPercent: number;
  startedAt: string;
  blocks: ActiveRoutineBlock[];
}

export interface ActiveRoutineBlock {
  blockNumber: number;
  blockTitle: string;
  sessions: ActiveRoutineSession[];
}

export interface ActiveRoutineSession {
  sessionId: number;
  title: string;
  totalSeries: number;
  mainMuscles: string;
  orderInBlock: number;
  completed: boolean;
  completedAt?: string;
}

export interface CurrentRoutineResponse {
  id: number;
  name: string;
  description: string;
  goal: string;
  suggestedLevel: string;
  daysPerWeek: number;
  durationWeeks: number;
  img: string;
  startedAt: string;
}
