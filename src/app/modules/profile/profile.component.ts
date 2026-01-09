import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProfileService } from './services/profile.service';
import { ProfileResponse, XP_RANKS } from './models/profile.models';
import { Achievement, UserAchievement } from './models/achievement.models';

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

  // Hazañas del backend (mostramos las primeras 4)
  achievements: Achievement[] = [];
  
  // Modal para nuevas hazañas
  newAchievementModal = false;
  newAchievement: UserAchievement | null = null;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAchievements();
    this.checkUnseenAchievements();
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

  loadAchievements(): void {
    this.profileService.getAchievements().subscribe({
      next: (achievements) => {
        // Mostrar solo las primeras 4 en el perfil
        this.achievements = achievements.slice(0, 4);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando hazañas:', err);
      }
    });
  }

  checkUnseenAchievements(): void {
    this.profileService.getUnseenAchievements().subscribe({
      next: (unseen) => {
        if (unseen.length > 0) {
          // Mostrar la primera hazaña no vista
          this.newAchievement = unseen[0];
          this.newAchievementModal = true;
          this.cdr.markForCheck();
        }
      }
    });
  }

  closeAchievementModal(): void {
    if (this.newAchievement) {
      // Marcar como vista
      this.profileService.markAchievementsAsSeen([this.newAchievement.code]).subscribe();
    }
    this.newAchievementModal = false;
    this.newAchievement = null;
    this.cdr.markForCheck();
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
    this.router.navigate(['/user/settings']);
  }

  goToRoutineHistory(): void {
    this.router.navigate(['/perfil/historial']);
  }

  goToMyCreatedRoutines(): void {
    this.router.navigate(['/perfil/mis-rutinas']);
  }

  goToAllAchievements(): void {
    this.router.navigate(['/perfil/hazanas']);
  }

  goToStats(): void {
    this.router.navigate(['/perfil/estadisticas']);
  }

 goToWorkoutDetail(sessionId: number): void {
    this.router.navigate(['/workouts', sessionId]); // ajusta a tu ruta real
  }


  goBack(): void {
    this.router.navigate(['/academia']);
  }
}

