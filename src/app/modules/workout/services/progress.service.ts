import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProgressSummary,
  WeeklyStats,
  ExerciseProgress,
  ProgressionRecommendation,
  Calculate1RMRequest,
  Calculate1RMResponse
} from '../models/progress.models';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene resumen general de progreso del usuario
   */
  getProgressSummary(weeks: number = 8): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${this.baseUrl}/progress/summary`, {
      params: { weeks: weeks.toString() }
    });
  }

  /**
   * Obtiene historial semanal
   */
  getWeeklyStats(weeks: number = 8): Observable<WeeklyStats[]> {
    return this.http.get<WeeklyStats[]>(`${this.baseUrl}/progress/weekly`, {
      params: { weeks: weeks.toString() }
    });
  }

  /**
   * Obtiene historial de progreso de un ejercicio específico
   */
  getExerciseProgress(exerciseId: number, sessions: number = 10): Observable<ExerciseProgress> {
    return this.http.get<ExerciseProgress>(`${this.baseUrl}/progress/exercises/${exerciseId}`, {
      params: { sessions: sessions.toString() }
    });
  }

  /**
   * Obtiene recomendación de progresión para un ejercicio
   */
  getProgressionRecommendation(
    exerciseId: number,
    plannedSets: number,
    repsMin: number,
    repsMax: number
  ): Observable<ProgressionRecommendation> {
    return this.http.get<ProgressionRecommendation>(
      `${this.baseUrl}/progress/exercises/${exerciseId}/recommendation`,
      {
        params: {
          plannedSets: plannedSets.toString(),
          repsMin: repsMin.toString(),
          repsMax: repsMax.toString()
        }
      }
    );
  }

  /**
   * Calcula 1RM estimado
   */
  calculate1RM(weightKg: number, reps: number): Observable<Calculate1RMResponse> {
    return this.http.post<Calculate1RMResponse>(`${this.baseUrl}/progress/calculate-1rm`, {
      weightKg,
      reps
    });
  }

  /**
   * Calcula 1RM localmente (sin llamada al servidor)
   * Fórmula de Epley: 1RM = peso * (1 + reps/30)
   */
  calculate1RMLocal(weightKg: number, reps: number): number | null {
    if (reps <= 0 || weightKg <= 0) return null;
    if (reps === 1) return weightKg;
    return weightKg * (1 + reps / 30);
  }

  /**
   * Formatea el volumen para mostrar
   */
  formatVolume(volumeKg: number): string {
    if (volumeKg >= 1000) {
      return `${(volumeKg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(volumeKg)} kg`;
  }

  /**
   * Formatea el tiempo en minutos
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  /**
   * Obtiene el color según el tipo de recomendación
   */
  getRecommendationColor(type: string): string {
    switch (type) {
      case 'INCREASE_WEIGHT':
        return 'text-emerald-400';
      case 'DECREASE_WEIGHT':
        return 'text-rose-400';
      case 'INCREASE_REPS':
        return 'text-teal-400';
      case 'MAINTAIN':
        return 'text-amber-400';
      case 'FIRST_TIME':
        return 'text-violet-400';
      default:
        return 'text-slate-400';
    }
  }

  /**
   * Obtiene el icono según el tipo de recomendación
   */
  getRecommendationIcon(type: string): string {
    switch (type) {
      case 'INCREASE_WEIGHT':
        return '↑';
      case 'DECREASE_WEIGHT':
        return '↓';
      case 'INCREASE_REPS':
        return '→';
      case 'MAINTAIN':
        return '=';
      case 'FIRST_TIME':
        return '★';
      default:
        return '•';
    }
  }
}
