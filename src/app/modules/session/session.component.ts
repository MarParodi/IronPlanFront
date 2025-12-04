// src/app/features/academia/session/session.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AcademyService } from './service/sesion.service';
import { TrainingSessionDetail } from './models/session.model';
import { WorkoutService } from '../workout/services/workout.services';

@Component({
  standalone: true,
  selector: 'app-session',
  imports: [CommonModule, RouterModule],
  templateUrl: './session.component.html'
})
export class SessionComponent {

  routineId!: number;
  routineDetailId!: number;   // 👈 Este es el que SÍ va al backend

  private route = inject(ActivatedRoute);
  private academy = inject(AcademyService);

  constructor(
    private workoutService: WorkoutService,
    private router: Router
  ) {}

  loading = signal(true);
  error = signal<string | null>(null);
  session = signal<TrainingSessionDetail | null>(null);

  totalSeries = computed(() => this.session()?.totalSeries ?? 0);
  estimatedMinutes = computed(() => this.session()?.estimatedMinutes ?? 0);
  estimatedXp = computed(() => this.session()?.estimatedXp ?? 0);

  ngOnInit(): void {
    // Leer parámetros de la URL
    const routineParam = this.route.snapshot.paramMap.get('routineId');
    const sessionParam = this.route.snapshot.paramMap.get('sessionId');

    const routineId = routineParam ? Number(routineParam) : NaN;
    const sessionId = sessionParam ? Number(sessionParam) : NaN;

    // Validación
    if (!routineId || !sessionId || Number.isNaN(routineId) || Number.isNaN(sessionId)) {
      this.error.set('Sesión inválida.');
      this.loading.set(false);
      return;
    }

    // 👇 Guardar en variables del componente
    this.routineId = routineId;
    this.routineDetailId = sessionId;   // 👈 ESTE es el ID que pide el backend

    // Cargar la información de la sesión (detalle visual)
    this.academy.getSession(routineId, sessionId).subscribe({
      next: (sess) => {
        this.session.set(sess);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar la sesión.');
        this.loading.set(false);
      }
    });
  }

  onBack(): void {
    history.back();
  }

  onSkip(): void {
    console.log('Saltar sesión (por implementar)');
  }

  onStartSession() {
    console.log('routineDetailId que mando:', this.routineDetailId);

    this.workoutService.startSession(this.routineDetailId)
      .subscribe({
        next: (resp) => {
          const sessionId = resp.sessionId;

          // Navegar al PRIMER ejercicio
          this.router.navigate(['/workouts', sessionId, 'exercise', 1]);
        },
        error: (err) => {
          console.error('startSession error', err);
        }
      });
  }

  trackByExercise = (_: number, ex: { id: number }) => ex.id;
}
