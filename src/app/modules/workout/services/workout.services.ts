// workout.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import {
  WorkoutExerciseDetailResponse,
  WorkoutSetRequest,
  ReorderNextExercisesRequest
} from '../models/workout.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkoutService {

  private baseUrl = environment.apiUrl; // 'http://localhost:8080/api'

  constructor(private http: HttpClient) { }

  /**
   * Detalle del ejercicio dentro de la sesión:
   * GET /api/workouts/{sessionId}/exercise/{order}
   */
  getExerciseDetail(sessionId: number, order: number): Observable<WorkoutExerciseDetailResponse> {
    const url = `${this.baseUrl}/workouts/${sessionId}/exercise/${order}`;
    return this.http.get<WorkoutExerciseDetailResponse>(url);
  }

  /**
   * Registrar/actualizar series de un ejercicio
   * POST /api/workouts/{sessionId}/exercises/{exerciseId}/sets
   */
  saveSets(
    sessionId: number,
    exerciseId: number,
    body: WorkoutSetRequest
  ): Observable<void> {
    const url = `${this.baseUrl}/workouts/${sessionId}/exercises/${exerciseId}/sets`;
    return this.http.post<void>(url, body);
  }

  /**
   * Reordenar los siguientes ejercicios
   * PATCH /api/workouts/sessions/{sessionId}/exercises/reorder-next
   */
  reorderNextExercises(
    sessionId: number,
    body: ReorderNextExercisesRequest
  ): Observable<void> {
    const url = `${this.baseUrl}/workouts/sessions/${sessionId}/exercises/reorder-next`;
    return this.http.patch<void>(url, body);
  }

  startSession(routineDetailId: number) {
    const body = { routineDetailId };
    return this.http.post<{ sessionId: number }>(
      `${this.baseUrl}/workouts/start`,
      body
    );
  }

}
