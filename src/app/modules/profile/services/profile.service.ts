import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileResponse, XP_RANKS } from '../models/profile.models';
import { MyRoutinesPage } from '../models/my-routines.models';
import { Achievement, UserAchievement, AchievementStats } from '../models/achievement.models';
import { environment } from '../../../../environments/environment';
import { RecentWorkoutDto } from '../models/profile.models';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/profile/me`);
  }

  /**
   * Calcula el progreso de XP dentro del rango actual
   * @returns Un valor entre 0 y 100
   */
  calculateXpProgress(lifetimeXp: number, rankCode: string | null): number {
    if (!rankCode) return 0;
    
    const currentRank = XP_RANKS.find(r => r.code === rankCode);
    if (!currentRank) return 0;

    // Si es el último rango, mostrar 100%
    if (currentRank.maxXp === Infinity) return 100;

    const rangeSize = currentRank.maxXp - currentRank.minXp + 1;
    const progress = lifetimeXp - currentRank.minXp;
    
    return Math.min(100, Math.round((progress / rangeSize) * 100));
  }

  /**
   * Obtiene el siguiente rango
   */
  getNextRank(rankCode: string | null): { label: string; xpNeeded: number } | null {
    if (!rankCode) return null;
    
    const currentIndex = XP_RANKS.findIndex(r => r.code === rankCode);
    if (currentIndex === -1 || currentIndex >= XP_RANKS.length - 1) return null;

    const nextRank = XP_RANKS[currentIndex + 1];
    return {
      label: nextRank.label,
      xpNeeded: nextRank.minXp
    };
  }

  getWorkoutHistory(): Observable<RecentWorkoutDto[]> {
  return this.http.get<any[]>(`${this.baseUrl}/profile/workouts`).pipe(
    map(list =>
      (list ?? []).map(item => ({
        sessionId: item.sessionId ?? item.id,
        routineName: item.routineName,
        date: item.date ?? item.startedAt,
        totalSeries: item.totalSeries ?? 0,
        totalWeightKg: item.totalWeightKg ?? 0,
        durationMinutes: item.durationMinutes ?? item.minutes ?? 0,
      }))
    )
  );
}

  /**
   * Genera las iniciales del usuario
   */
  getInitials(username: string): string {
    if (!username) return '?';
    
    const parts = username.split(/[\s_-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  /**
   * Obtiene las rutinas creadas por el usuario
   */
  getMyCreatedRoutines(page: number = 0, size: number = 20): Observable<MyRoutinesPage> {
    return this.http.get<MyRoutinesPage>(`${this.baseUrl}/routines/mine`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  /**
   * Elimina una rutina creada por el usuario
   */
  deleteRoutine(routineId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/routines/${routineId}`);
  }

  // ============ ACHIEVEMENTS / HAZAÑAS ============

  /**
   * Obtiene todas las hazañas con estado de desbloqueo
   */
  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.baseUrl}/achievements`);
  }

  /**
   * Obtiene estadísticas de hazañas del usuario
   */
  getAchievementStats(): Observable<AchievementStats> {
    return this.http.get<AchievementStats>(`${this.baseUrl}/achievements/stats`);
  }

  /**
   * Obtiene hazañas recién desbloqueadas (no vistas)
   */
  getUnseenAchievements(): Observable<UserAchievement[]> {
    return this.http.get<UserAchievement[]>(`${this.baseUrl}/achievements/unseen`);
  }

  /**
   * Marca hazañas como vistas
   */
  markAchievementsAsSeen(codes: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/achievements/mark-seen`, { codes });
  }
}

