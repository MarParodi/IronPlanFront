import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileResponse, XP_RANKS } from '../models/profile.models';
import { environment } from '../../../../environments/environment';

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
}

