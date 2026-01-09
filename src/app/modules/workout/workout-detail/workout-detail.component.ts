import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkoutService } from '../services/workout.services';
import { WorkoutSessionDetailResponse } from '../models/workout-detail.models';

@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workout-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutDetailComponent implements OnInit {
  loading = true;
  error: string | null = null;
  detail: WorkoutSessionDetailResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!sessionId) {
      this.error = 'Sesión inválida.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.workoutService.getSessionDetail(sessionId).subscribe({
      next: (d) => {
        // ordenar ejercicios por si acaso
        d.exercises = (d.exercises ?? []).slice().sort((a, b) => (a.exerciseOrder ?? 0) - (b.exerciseOrder ?? 0));
        this.detail = d;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el detalle.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  back(): void {
    this.router.navigate(['/perfil/historial']);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // formato simple yyyy/mm/dd
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  formatKg(v: number): string {
    return (v ?? 0).toFixed(1);
  }

  formatDuration(mins: number): string {
    if (!mins || mins <= 0) return '0 min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  }

  // “Series efectivas” = totalSeries (como tu pantalla)
  get totalSeries(): number {
    return this.detail?.totalSeries ?? 0;
  }

  get totalKg(): string {
    return this.formatKg(this.detail?.totalWeightKg ?? 0);
  }
}
