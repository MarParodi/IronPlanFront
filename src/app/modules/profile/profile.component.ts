import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProfileService } from './services/profile.service';
import { ProfileResponse, XP_RANKS } from './models/profile.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  profile: ProfileResponse | null = null;
  loading = true;
  error: string | null = null;

  // Hazañas estáticas (por ahora)
  achievements = [
    { id: 'first_routine', name: 'Primera Rutina', icon: 'trophy', unlocked: true },
    { id: 'ten_workouts', name: '10 Entrenamientos', icon: 'medal', unlocked: false },
    { id: 'weekly_goal', name: 'Meta Semanal', icon: 'target', unlocked: false },
    { id: 'streak_7', name: 'Racha 7 días', icon: 'fire', unlocked: false },
  ];

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.profile = response;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.error = 'No se pudo cargar el perfil';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Helpers
  getInitials(): string {
    if (!this.profile?.header.username) return '??';
    return this.profileService.getInitials(this.profile.header.username);
  }

  getXpProgress(): number {
    if (!this.profile) return 0;
    return this.profileService.calculateXpProgress(
      this.profile.header.lifetimeXp,
      this.profile.header.xpRankCode
    );
  }

  getNextRankInfo(): { label: string; xpNeeded: number } | null {
    if (!this.profile) return null;
    return this.profileService.getNextRank(this.profile.header.xpRankCode);
  }

  getXpToNextRank(): number {
    const next = this.getNextRankInfo();
    if (!next || !this.profile) return 0;
    return Math.max(0, next.xpNeeded - this.profile.header.lifetimeXp);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatRelativeDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return this.formatDate(dateStr);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  formatWeight(kg: number): string {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)} kg`;
  }

  // Navegación
  goToSettings(): void {
    // TODO: Implementar página de configuración
    console.log('Ir a configuración');
  }

  goToRoutineHistory(): void {
    this.router.navigate(['/mis-rutinas']);
  }

  goToMyCreatedRoutines(): void {
    // TODO: Implementar página de rutinas creadas
    console.log('Ver rutinas creadas');
  }

  goToAllAchievements(): void {
    // TODO: Implementar página de hazañas
    console.log('Ver todas las hazañas');
  }

  goToWorkoutDetail(sessionId: number): void {
    // TODO: Implementar vista de detalle del workout
    console.log('Ver workout:', sessionId);
  }

  goBack(): void {
    this.router.navigate(['/academia']);
  }
}

