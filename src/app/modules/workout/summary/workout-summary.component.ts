// workout-summary.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkoutService } from '../services/workout.services';
import { WorkoutSessionSummaryResponse } from '../models/workout-summary.model';

@Component({
  standalone: true,
  selector: 'app-workout-summary',
  templateUrl: './workout-summary.component.html',
  imports: [CommonModule, RouterModule]
})
export class WorkoutSummaryComponent implements OnInit {

  sessionId!: number;
  summary: WorkoutSessionSummaryResponse | null = null;
  loading = true;
  error: string | null = null;

  // Para la animación del confetti
  showConfetti = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService
  ) {}

  ngOnInit(): void {
    const sessionParam = this.route.snapshot.paramMap.get('sessionId');
    this.sessionId = sessionParam ? Number(sessionParam) : NaN;

    if (!this.sessionId || Number.isNaN(this.sessionId)) {
      this.error = 'Sesión inválida.';
      this.loading = false;
      return;
    }

    this.loadSummary();

    // Ocultar confetti después de 5 segundos
    setTimeout(() => {
      this.showConfetti = false;
    }, 5000);
  }

  private loadSummary(): void {
    this.workoutService.getSessionSummary(this.sessionId).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading summary:', err);
        this.error = 'No se pudo cargar el resumen de la sesión.';
        this.loading = false;
      }
    });
  }

  onGoHome(): void {
    this.router.navigate(['/']);
  }

  onViewHistory(): void {
    // Navegar al historial (por implementar)
    console.log('Ver historial');
  }

  // Helpers para mostrar datos
  get durationImproved(): boolean {
    if (!this.summary?.previousComparison) return false;
    return this.summary.previousComparison.durationDifferenceSeconds < 0;
  }

  get xpImproved(): boolean {
    if (!this.summary?.previousComparison) return false;
    return this.summary.previousComparison.xpDifference > 0;
  }

  formatDurationDiff(seconds: number): string {
    const abs = Math.abs(seconds);
    const min = Math.floor(abs / 60);
    const sec = abs % 60;
    const sign = seconds < 0 ? '-' : '+';
    return `${sign}${min}:${sec.toString().padStart(2, '0')}`;
  }
}

