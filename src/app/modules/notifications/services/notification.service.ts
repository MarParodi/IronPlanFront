import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  NotificationDto,
  NotificationPageResponse,
  NotificationCountResponse,
  NotificationType
} from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = environment.apiUrl;
  
  // Subject para el contador de no leídas (reactivo para el badge)
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtener notificaciones con paginación y filtros
   */
  getNotifications(params: {
    page?: number;
    size?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}): Observable<NotificationPageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));

    if (params.unreadOnly !== undefined) {
      httpParams = httpParams.set('unreadOnly', String(params.unreadOnly));
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<NotificationPageResponse>(
      `${this.baseUrl}/notifications`,
      { params: httpParams }
    ).pipe(
      tap(response => this.unreadCountSubject.next(response.unreadCount))
    );
  }

  /**
   * Obtener conteo de no leídas (para el badge)
   */
  getUnreadCount(): Observable<NotificationCountResponse> {
    return this.http.get<NotificationCountResponse>(
      `${this.baseUrl}/notifications/count`
    ).pipe(
      tap(response => this.unreadCountSubject.next(response.unreadCount))
    );
  }

  /**
   * Refrescar el conteo de no leídas
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(id: number): Observable<NotificationDto> {
    return this.http.patch<NotificationDto>(
      `${this.baseUrl}/notifications/${id}/read`,
      {}
    ).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) {
          this.unreadCountSubject.next(current - 1);
        }
      })
    );
  }

  /**
   * Marcar notificación como no leída
   */
  markAsUnread(id: number): Observable<NotificationDto> {
    return this.http.patch<NotificationDto>(
      `${this.baseUrl}/notifications/${id}/unread`,
      {}
    ).pipe(
      tap(() => {
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      })
    );
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/notifications/mark-all-read`,
      {}
    ).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  /**
   * Eliminar una notificación
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications/${id}`);
  }

  /**
   * Eliminar todas las notificaciones
   */
  deleteAllNotifications(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications`).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  // ============ HELPERS PARA UI ============

  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case 'SUCCESS': return '✓';
      case 'INFO': return 'ℹ';
      case 'WARNING': return '⚠';
      case 'ERROR': return '✕';
      default: return '•';
    }
  }

  getTypeColor(type: NotificationType): string {
    switch (type) {
      case 'SUCCESS': return 'text-emerald-400';
      case 'INFO': return 'text-blue-400';
      case 'WARNING': return 'text-amber-400';
      case 'ERROR': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  }

  getTypeBgColor(type: NotificationType): string {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'INFO': return 'bg-blue-500/20 border-blue-500/30';
      case 'WARNING': return 'bg-amber-500/20 border-amber-500/30';
      case 'ERROR': return 'bg-rose-500/20 border-rose-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30';
    }
  }

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
