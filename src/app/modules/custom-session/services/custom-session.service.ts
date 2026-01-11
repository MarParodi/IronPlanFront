import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CatalogExercise,
  StartCustomSessionRequest,
  StartCustomSessionResponse
} from '../models/custom-session.models';

@Injectable({
  providedIn: 'root'
})
export class CustomSessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Buscar ejercicios del catálogo
   */
  searchExercises(query: string): Observable<{ content: CatalogExercise[] }> {
    return this.http.get<{ content: CatalogExercise[] }>(`${this.baseUrl}/exercises`, {
      params: { q: query, size: '20' }
    });
  }

  /**
   * Obtener ejercicios del catálogo paginados
   */
  getExercises(page: number = 0, size: number = 50): Observable<{ content: CatalogExercise[] }> {
    return this.http.get<{ content: CatalogExercise[] }>(`${this.baseUrl}/exercises`, {
      params: { page: String(page), size: String(size) }
    });
  }

  /**
   * Iniciar sesión personalizada
   */
  startCustomSession(request: StartCustomSessionRequest): Observable<StartCustomSessionResponse> {
    return this.http.post<StartCustomSessionResponse>(
      `${this.baseUrl}/workouts/custom/start`,
      request
    );
  }
}
