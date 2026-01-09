import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { RecentWorkoutDto } from '../models/profile.models';

@Component({
  selector: 'app-workout-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workout-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutHistoryComponent implements OnInit {
  workouts: RecentWorkoutDto[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    this.profileService.getWorkoutHistory().subscribe({
      next: (data) => {
        this.workouts = data ?? [];
        this.loading = false;

        // 🔥 clave para OnPush (evita “cargando” infinito)
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el historial.';
        this.loading = false;

        // 🔥 clave para OnPush
        this.cdr.markForCheck();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/perfil']); // ajusta si tu ruta de perfil es otra
  }

  goToWorkoutDetail(sessionId: number): void {
    this.router.navigate(['/workouts', sessionId]); // ajusta a tu ruta real
  }

  formatDuration(mins: number): string {
    if (!mins || mins <= 0) return '0 min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  }

  formatWeight(v: number): string {
    return `${Math.round(v ?? 0)} kg`;
  }

  formatRelativeDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Hace 1 día';
    if (days < 7) return `Hace ${days} días`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return 'Hace 1 semana';
    if (weeks < 5) return `Hace ${weeks} semanas`;
    const months = Math.floor(days / 30);
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  }
}
