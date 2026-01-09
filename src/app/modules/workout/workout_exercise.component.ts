// src/app/modules/workout/workout_exercise.component.ts
// workout-exercise-page.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  NextExerciseSummaryDto,
  WorkoutExerciseDetailResponse,
  WorkoutSetItemRequest,
  WorkoutSetRequest
} from './models/workout.models';
import { WorkoutService } from './services/workout.services';
import { ProgressService } from './services/progress.service';
import { ProgressionRecommendation } from './models/progress.models';
import { SafePipe } from './pipes/safe.pipe';
import { Subscription, interval } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-workout-exercise-page',
  templateUrl: './workout_exercises.component.html',
  imports: [
    CommonModule,   // 👉 NgIf, NgFor, pipes como number, etc.
    FormsModule,    // 👉 [(ngModel)]
    RouterModule,
    SafePipe        // 👉 Para sanitizar URLs de videos
  ]
})
export class WorkoutExercisePageComponent implements OnInit, OnDestroy {

  // Parámetros de ruta
  sessionId!: number;
  order!: number;

  // Datos que vienen del backend
  data: WorkoutExerciseDetailResponse | null = null;

  // Series que el usuario está llenando
  currentSets: WorkoutSetItemRequest[] = [];
  notes: string | null = null;

  // Timer
  elapsedSeconds = 0;
  private timerSub?: Subscription;

  // Loading / error
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  // Video modal
  showVideoModal = false;

  // Recomendación de progresión
  recommendation: ProgressionRecommendation | null = null;
  loadingRecommendation = false;
  showRecommendationModal = false;

  // Modal de salida
  showExitModal = false;
  exitAction: 'discard' | 'finish' | null = null;
  processingExit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private progressService: ProgressService
  ) {}

  // ─────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = Number(params.get('sessionId'));
      this.order = Number(params.get('order'));

      if (!this.sessionId || !this.order || Number.isNaN(this.sessionId) || Number.isNaN(this.order)) {
        this.errorMessage = 'Entrenamiento inválido.';
        return;
      }

      this.loadExercise();
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ─────────────────────────────────────────────
  // Carga de ejercicio actual
  // ─────────────────────────────────────────────

  private loadExercise(): void {
    this.loading = true;
    this.errorMessage = null;

    this.workoutService.getExerciseDetail(this.sessionId, this.order)
      .subscribe({
        next: (resp) => {
          this.data = resp;
          this.setupSets(resp);
          this.setupTimer(resp);
          this.loading = false;
          
          // Cargar recomendación de progresión
          this.loadRecommendation(resp);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Ocurrió un error al cargar el ejercicio.';
          this.loading = false;
        }
      });
  }

  private loadRecommendation(resp: WorkoutExerciseDetailResponse): void {
    // Necesitamos el exerciseId - lo obtenemos del routineExerciseId o directamente
    // Asumimos que el backend expone exerciseId en la respuesta
    if (!resp.exerciseId) return;

    this.loadingRecommendation = true;
    this.progressService.getProgressionRecommendation(
      resp.exerciseId,
      resp.plannedSets,
      resp.plannedRepsMin,
      resp.plannedRepsMax
    ).subscribe({
      next: (rec) => {
        this.recommendation = rec;
        this.loadingRecommendation = false;
        
        // Pre-llenar peso sugerido si hay recomendación
        if (rec.suggestedWeightKg && this.currentSets.length > 0) {
          this.applySuggestedWeight(rec.suggestedWeightKg);
        }
      },
      error: (err) => {
        console.error('Error cargando recomendación:', err);
        this.loadingRecommendation = false;
      }
    });
  }

  applySuggestedWeight(weight: number): void {
    // Aplicar peso sugerido a todas las series que no tienen peso
    this.currentSets.forEach(set => {
      if (set.weightKg === null || set.weightKg === undefined) {
        set.weightKg = weight;
      }
    });
  }

  openRecommendationModal(): void {
    this.showRecommendationModal = true;
  }

  closeRecommendationModal(): void {
    this.showRecommendationModal = false;
  }

  getRecommendationColor(): string {
    if (!this.recommendation) return 'text-slate-400';
    return this.progressService.getRecommendationColor(this.recommendation.type);
  }

  getRecommendationIcon(): string {
    if (!this.recommendation) return '•';
    return this.progressService.getRecommendationIcon(this.recommendation.type);
  }

  getRecommendationBgColor(): string {
    if (!this.recommendation) return 'bg-slate-700/20';
    switch (this.recommendation.type) {
      case 'INCREASE_WEIGHT': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'DECREASE_WEIGHT': return 'bg-rose-500/20 border-rose-500/30';
      case 'INCREASE_REPS': return 'bg-teal-500/20 border-teal-500/30';
      case 'MAINTAIN': return 'bg-amber-500/20 border-amber-500/30';
      case 'FIRST_TIME': return 'bg-violet-500/20 border-violet-500/30';
      default: return 'bg-slate-700/20';
    }
  }

  /**
   * Inicializa las series basadas en plannedSets.
   * Aquí puedes precargar info de previousSet si quisieras.
   */
  private setupSets(resp: WorkoutExerciseDetailResponse): void {
    const sets: WorkoutSetItemRequest[] = [];

    for (let i = 1; i <= resp.plannedSets; i++) {
      sets.push({
        setNumber: i,
        reps: null,
        weightKg: null,
        completed: false
      });
    }

    this.currentSets = sets;
    this.notes = null;
  }

  /**
   * Timer basado en progress.startedAt
   */
  private setupTimer(resp: WorkoutExerciseDetailResponse): void {
    this.stopTimer();

    const startedAt = new Date(resp.progress.startedAt).getTime();

    this.timerSub = interval(1000).subscribe(() => {
      const now = Date.now();
      const diffMs = now - startedAt;
      this.elapsedSeconds = Math.max(0, Math.floor(diffMs / 1000));
    });
  }

  private stopTimer(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }

  /**
   * Formatea el timer como 00:05:16
   */
  get elapsedFormatted(): string {
    const total = this.elapsedSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Alias para usar en el template
   */
  get timerLabel(): string {
    return this.elapsedFormatted;
  }

  /**
   * Mostrar modal de confirmación de salida
   */
  onBack(): void {
    this.showExitModal = true;
  }

  /**
   * Cerrar modal de salida
   */
  closeExitModal(): void {
    this.showExitModal = false;
    this.exitAction = null;
  }

  /**
   * Descartar la sesión y salir
   */
  onDiscardSession(): void {
    this.processingExit = true;
    this.workoutService.discardSession(this.sessionId).subscribe({
      next: () => {
        this.processingExit = false;
        this.showExitModal = false;
        this.router.navigate(['/mis-rutinas']);
      },
      error: (err) => {
        console.error('Error al descartar sesión:', err);
        this.processingExit = false;
        this.errorMessage = 'No se pudo descartar la sesión.';
      }
    });
  }

  /**
   * Finalizar la sesión guardando el progreso y salir
   */
  onFinishSession(): void {
    this.processingExit = true;
    this.workoutService.finishSession(this.sessionId).subscribe({
      next: () => {
        this.processingExit = false;
        this.showExitModal = false;
        this.router.navigate(['/workouts', this.sessionId, 'summary']);
      },
      error: (err) => {
        console.error('Error al finalizar sesión:', err);
        this.processingExit = false;
        this.errorMessage = 'No se pudo finalizar la sesión.';
      }
    });
  }

  /**
   * Alternar el estado de completado de una serie
   */
  onToggleSetCompleted(index: number): void {
    if (this.currentSets[index]) {
      this.currentSets[index].completed = !this.currentSets[index].completed;
    }
  }

  /**
   * Alias para el botón "Registrar y continuar"
   */
  onRegisterAndContinue(): void {
    this.onSaveAndNext();
  }

  // ─────────────────────────────────────────────
  // Guardar series y avanzar
  // ─────────────────────────────────────────────

  /**
   * Verifica si este es el último ejercicio de la sesión
   */
  get isLastExercise(): boolean {
    if (!this.data) return false;
    return this.data.nextExercises.length === 0;
  }

  /**
   * Texto del botón según si es último o no
   */
  get submitButtonText(): string {
    return this.isLastExercise ? '✓ Finalizar sesión' : 'Registrar y continuar →';
  }

  onSaveAndNext(): void {
    if (!this.data) return;

    this.saving = true;

    const body: WorkoutSetRequest = {
      sets: this.currentSets,
      notes: this.notes
    };

    this.workoutService.saveSets(this.sessionId, this.data.workoutExerciseId, body)
      .subscribe({
        next: () => {
          this.saving = false;

          // Si es el último ejercicio, ir al resumen
          if (this.isLastExercise) {
            this.router.navigate(['/workouts', this.sessionId, 'summary']);
          } else {
            // Ir al siguiente ejercicio por order+1
            const nextOrder = this.data!.exerciseOrder + 1;
            this.router.navigate(['/workouts', this.sessionId, 'exercise', nextOrder]);
          }
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.errorMessage = 'No se pudieron guardar las series.';
        }
      });
  }

  // ─────────────────────────────────────────────
  // Video
  // ─────────────────────────────────────────────

  /**
   * Verifica si hay video disponible
   */
  get hasVideo(): boolean {
    return !!this.data?.exerciseVideoUrl;
  }

  /**
   * Obtiene el ID del video de YouTube si es una URL de YouTube
   */
  get youtubeVideoId(): string | null {
    if (!this.data?.exerciseVideoUrl) return null;
    
    const url = this.data.exerciseVideoUrl;
    
    // Patrones de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * URL del embed de YouTube
   */
  get youtubeEmbedUrl(): string | null {
    const id = this.youtubeVideoId;
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }

  /**
   * Es un video directo (no YouTube)
   */
  get isDirectVideo(): boolean {
    if (!this.data?.exerciseVideoUrl) return false;
    return !this.youtubeVideoId;
  }

  openVideoModal(): void {
    this.showVideoModal = true;
  }

  closeVideoModal(): void {
    this.showVideoModal = false;
  }
  // ─────────────────────────────────────────────
  // Reordenar siguientes ejercicios en la UI
  // ─────────────────────────────────────────────

  moveNextExerciseUp(index: number): void {
    if (!this.data || index <= 0) return;

    const arr = [...this.data.nextExercises];
    const temp = arr[index - 1];
    arr[index - 1] = arr[index];
    arr[index] = temp;
    this.data = { ...this.data, nextExercises: arr };
  }

  moveNextExerciseDown(index: number): void {
    if (!this.data || index >= this.data.nextExercises.length - 1) return;

    const arr = [...this.data.nextExercises];
    const temp = arr[index + 1];
    arr[index + 1] = arr[index];
    arr[index] = temp;
    this.data = { ...this.data, nextExercises: arr };
  }

  onSaveReorder(): void {
    if (!this.data) return;

    const body = {
      workoutExerciseIds: this.data.nextExercises.map(x => x.workoutExerciseId)
    };

    this.workoutService.reorderNextExercises(this.sessionId, body)
      .subscribe({
        next: () => {
          // Si quieres, mostrar toast / recargar datos
          this.loadExercise();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'No se pudo guardar el nuevo orden de ejercicios.';
        }
      });
  }
}
