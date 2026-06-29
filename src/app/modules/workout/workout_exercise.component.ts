// src/app/modules/workout/workout_exercise.component.ts
// workout-exercise-page.component.ts

import { Component, OnDestroy, OnInit, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { CreateRoutineService } from '../create-routine/services/create-routine.service';
import { Exercise } from '../create-routine/models/create-routine.models';
import { SafePipe } from './pipes/safe.pipe';
import { Subscription, interval, switchMap, of, Observable } from 'rxjs';

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
  private sessionStartedAtMs: number | null = null;
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
  recommendationModalTarget: 'main' | 'paired' = 'main';
  pairedRecommendation: ProgressionRecommendation | null = null;
  loadingPairedRecommendation = false;

  // Modal de salida
  showExitModal = false;
  exitAction: 'discard' | 'finish' | null = null;
  processingExit = false;

  weightUnit: 'KG' | 'LB' = 'KG';
  displayWeights: (number | null)[] = [];

  restSecondsRemaining = 0;
  restTimerActive = false;
  private restEndsAtMs: number | null = null;
  private restTimerSub?: Subscription;
  private visibilityHandler = (): void => this.onPageVisibleAgain();

  newExerciseId: number | null = null;
  newExerciseName = '';
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  showExerciseDropdown = false;
  loadingExercises = false;
  addingExercise = false;
  removingExercise = false;
  mutatingSets = false;
  reorderDirty = false;
  savingReorder = false;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Superset: ejercicio combinado con el siguiente
  pairedData: WorkoutExerciseDetailResponse | null = null;
  pairedSets: WorkoutSetItemRequest[] = [];
  pairedDisplayWeights: (number | null)[] = [];
  pairedNotes: string | null = null;
  isCombined = false;
  loadingPaired = false;
  mutatingPairedSets = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private progressService: ProgressService,
    private createRoutineService: CreateRoutineService,
    private cdr: ChangeDetectorRef
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

    if (this.isBrowser) {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.stopTimer();
    this.stopRestTimer();
  }

  /** Al volver a la pestaña, recalculamos con la hora real (el interval se pausa en background). */
  private onPageVisibleAgain(): void {
    if (document.visibilityState !== 'visible') return;
    this.updateElapsed();
    this.updateRestRemaining();
  }

  // ─────────────────────────────────────────────
  // Carga de ejercicio actual
  // ─────────────────────────────────────────────

  private loadExercise(): void {
    const comboAnchor = this.getComboAnchorOrder();
    if (comboAnchor != null && this.order === comboAnchor + 1) {
      this.router.navigate(['/workouts', this.sessionId, 'exercise', comboAnchor], { replaceUrl: true });
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.resetPairedState();
    this.reorderDirty = false;
    this.savingReorder = false;

    this.workoutService.getExerciseDetail(this.sessionId, this.order)
      .subscribe({
        next: (resp) => {
          this.data = resp;
          this.setupSets(resp);
          this.setupTimer(resp);
          this.loading = false;

          this.loadRecommendation(resp);

          if (this.getComboAnchorOrder() === this.order) {
            this.loadPairedExercise(this.order + 1);
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Ocurrió un error al cargar el ejercicio.';
          this.loading = false;
        }
      });
  }

  private comboStorageKey(): string {
    return `workout-combo:${this.sessionId}`;
  }

  private saveComboState(anchorOrder: number): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(this.comboStorageKey(), JSON.stringify({ anchorOrder }));
  }

  private clearComboState(): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(this.comboStorageKey());
  }

  private getComboAnchorOrder(): number | null {
    if (!this.isBrowser) return null;
    const raw = sessionStorage.getItem(this.comboStorageKey());
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const n = Number(parsed?.anchorOrder);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  private resetPairedState(): void {
    this.pairedData = null;
    this.pairedSets = [];
    this.pairedDisplayWeights = [];
    this.pairedNotes = null;
    this.pairedRecommendation = null;
    this.loadingPairedRecommendation = false;
    this.isCombined = false;
    this.loadingPaired = false;
  }

  combineWithNext(): void {
    if (!this.data || this.data.nextExercises.length === 0 || this.isCombined || this.loadingPaired) return;
    this.saveComboState(this.order);
    this.loadPairedExercise(this.order + 1);
  }

  uncombine(): void {
    this.clearComboState();
    this.pairedData = null;
    this.pairedSets = [];
    this.pairedDisplayWeights = [];
    this.pairedNotes = null;
    this.pairedRecommendation = null;
    this.loadingPairedRecommendation = false;
    this.isCombined = false;
    this.loadingPaired = false;
    this.cdr.markForCheck();
  }

  private loadPairedExercise(pairedOrder: number): void {
    this.loadingPaired = true;
    this.workoutService.getExerciseDetail(this.sessionId, pairedOrder).subscribe({
      next: (resp) => {
        this.setupPairedSets(resp);
        this.isCombined = true;
        this.loadingPaired = false;
        this.loadPairedRecommendation(resp);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingPaired = false;
        this.clearComboState();
        this.resetPairedState();
        this.errorMessage = 'No se pudo cargar el ejercicio combinado.';
        this.cdr.markForCheck();
      },
    });
  }

  get nextExerciseName(): string | null {
    return this.data?.nextExercises?.[0]?.exerciseName ?? null;
  }

  get canCombineWithNext(): boolean {
    return !!this.data && this.data.nextExercises.length > 0 && !this.isCombined && !this.loadingPaired;
  }

  private loadRecommendation(resp: WorkoutExerciseDetailResponse): void {
    if (!resp.exerciseId) return;

    this.loadingRecommendation = true;
    this.fetchRecommendation(resp).subscribe({
      next: (rec) => {
        this.recommendation = rec;
        this.loadingRecommendation = false;
        if (rec?.suggestedWeightKg && this.currentSets.length > 0) {
          this.applySuggestedWeight(rec.suggestedWeightKg);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando recomendación:', err);
        this.loadingRecommendation = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadPairedRecommendation(resp: WorkoutExerciseDetailResponse): void {
    if (!resp.exerciseId) return;

    this.loadingPairedRecommendation = true;
    this.pairedRecommendation = null;
    this.fetchRecommendation(resp).subscribe({
      next: (rec) => {
        this.pairedRecommendation = rec;
        this.loadingPairedRecommendation = false;
        if (rec?.suggestedWeightKg && this.pairedSets.length > 0) {
          this.applySuggestedPairedWeight(rec.suggestedWeightKg);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando recomendación pareada:', err);
        this.loadingPairedRecommendation = false;
        this.cdr.markForCheck();
      },
    });
  }

  private fetchRecommendation(resp: WorkoutExerciseDetailResponse): Observable<ProgressionRecommendation | null> {
    if (!resp.exerciseId) return of(null);
    return this.progressService.getProgressionRecommendation(
      resp.exerciseId,
      resp.plannedSets,
      resp.plannedRepsMin,
      resp.plannedRepsMax
    );
  }

  applySuggestedWeight(weight: number, overwriteExisting = false): void {
    this.currentSets.forEach(set => {
      if (overwriteExisting || set.weightKg === null || set.weightKg === undefined) {
        set.weightKg = weight;
      }
    });
    this.syncDisplayWeights();
  }

  applySuggestedPairedWeight(weight: number, overwriteExisting = false): void {
    this.pairedSets.forEach(set => {
      if (overwriteExisting || set.weightKg === null || set.weightKg === undefined) {
        set.weightKg = weight;
      }
    });
    this.syncPairedDisplayWeights();
  }

  private syncDisplayWeights(): void {
    this.displayWeights = this.currentSets.map(set => {
      if (set.weightKg == null) return null;
      return this.weightUnit === 'LB' ? this.kgToLb(set.weightKg) : set.weightKg;
    });
    this.cdr.markForCheck();
  }

  openRecommendationModal(): void {
    this.recommendationModalTarget = 'main';
    this.showRecommendationModal = true;
  }

  openPairedRecommendationModal(): void {
    this.recommendationModalTarget = 'paired';
    this.showRecommendationModal = true;
  }

  closeRecommendationModal(): void {
    this.showRecommendationModal = false;
  }

  get activeRecommendationForModal(): ProgressionRecommendation | null {
    return this.recommendationModalTarget === 'paired'
      ? this.pairedRecommendation
      : this.recommendation;
  }

  applyActiveRecommendationWeight(overwriteExisting = false): void {
    const rec = this.activeRecommendationForModal;
    if (!rec?.suggestedWeightKg) return;
    if (this.recommendationModalTarget === 'paired') {
      this.applySuggestedPairedWeight(rec.suggestedWeightKg, overwriteExisting);
    } else {
      this.applySuggestedWeight(rec.suggestedWeightKg, overwriteExisting);
    }
  }

  getRecommendationColor(): string {
    return this.getRecommendationColorFor(this.recommendation);
  }

  getRecommendationIcon(): string {
    return this.getRecommendationIconFor(this.recommendation);
  }

  getRecommendationBgColor(): string {
    return this.getRecommendationBgColorFor(this.recommendation);
  }

  getPairedRecommendationColor(): string {
    return this.getRecommendationColorFor(this.pairedRecommendation);
  }

  getPairedRecommendationIcon(): string {
    return this.getRecommendationIconFor(this.pairedRecommendation);
  }

  getPairedRecommendationBgColor(): string {
    return this.getRecommendationBgColorFor(this.pairedRecommendation);
  }

  getRecommendationColorFor(rec: ProgressionRecommendation | null): string {
    if (!rec) return 'text-ip-muted';
    return this.progressService.getRecommendationColor(rec.type);
  }

  getRecommendationIconFor(rec: ProgressionRecommendation | null): string {
    if (!rec) return '•';
    return this.progressService.getRecommendationIcon(rec.type);
  }

  getRecommendationBgColorFor(rec: ProgressionRecommendation | null): string {
    if (!rec) return 'bg-slate-700/20';
    switch (rec.type) {
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
  private buildSetsFromResponse(resp: WorkoutExerciseDetailResponse): WorkoutSetItemRequest[] {
    const sets: WorkoutSetItemRequest[] = [];
    for (let i = 1; i <= resp.plannedSets; i++) {
      sets.push({
        setNumber: i,
        reps: null,
        weightKg: null,
        completed: false,
        rirRegistrado: resp.plannedRir ?? 2,
      });
    }
    return sets;
  }

  private setupSets(resp: WorkoutExerciseDetailResponse): void {
    this.currentSets = this.buildSetsFromResponse(resp);
    this.displayWeights = this.currentSets.map(() => null);
    this.notes = null;
  }

  private setupPairedSets(resp: WorkoutExerciseDetailResponse): void {
    this.pairedData = resp;
    this.pairedSets = this.buildSetsFromResponse(resp);
    this.pairedDisplayWeights = this.pairedSets.map(() => null);
    this.pairedNotes = null;
  }

  private lbToKg(value: number): number {
    return Math.round(value * 0.453592 * 100) / 100;
  }

  private kgToLb(value: number): number {
    return Math.round(value * 2.20462 * 10) / 10;
  }

  toggleWeightUnit(): void {
    this.weightUnit = this.weightUnit === 'KG' ? 'LB' : 'KG';
    this.syncDisplayWeights();
    this.syncPairedDisplayWeights();
  }

  onWeightInput(index: number, value: number | null): void {
    this.displayWeights[index] = value;
    if (value == null) {
      this.currentSets[index].weightKg = null;
      return;
    }
    this.currentSets[index].weightKg =
      this.weightUnit === 'LB' ? this.lbToKg(value) : value;
  }

  onPairedWeightInput(index: number, value: number | null): void {
    this.pairedDisplayWeights[index] = value;
    if (value == null) {
      this.pairedSets[index].weightKg = null;
      return;
    }
    this.pairedSets[index].weightKg =
      this.weightUnit === 'LB' ? this.lbToKg(value) : value;
  }

  private syncPairedDisplayWeights(): void {
    this.pairedDisplayWeights = this.pairedSets.map(set => {
      if (set.weightKg == null) return null;
      return this.weightUnit === 'LB' ? this.kgToLb(set.weightKg) : set.weightKg;
    });
    this.cdr.markForCheck();
  }

  get weightPlaceholder(): string {
    return this.weightUnit === 'LB' ? 'lb' : 'kg';
  }

  private startRestTimer(): void {
    if (!this.data?.plannedRestSeconds) return;
    this.stopRestTimer(false);
    this.restEndsAtMs = Date.now() + this.data.plannedRestSeconds * 1000;
    this.restTimerActive = true;
    this.updateRestRemaining();
    this.restTimerSub = interval(1000).subscribe(() => this.updateRestRemaining());
  }

  private updateRestRemaining(): void {
    if (this.restEndsAtMs == null) return;

    const remainingMs = this.restEndsAtMs - Date.now();
    if (remainingMs <= 0) {
      this.stopRestTimer();
      return;
    }

    this.restSecondsRemaining = Math.ceil(remainingMs / 1000);
    this.cdr.markForCheck();
  }

  private stopRestTimer(resetDisplay = true): void {
    this.restTimerActive = false;
    this.restEndsAtMs = null;
    if (resetDisplay) {
      this.restSecondsRemaining = 0;
    }
    if (this.restTimerSub) {
      this.restTimerSub.unsubscribe();
      this.restTimerSub = undefined;
    }
    this.cdr.markForCheck();
  }

  get restTimerLabel(): string {
    const mm = Math.floor(this.restSecondsRemaining / 60).toString().padStart(2, '0');
    const ss = (this.restSecondsRemaining % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  skipRestTimer(): void {
    this.stopRestTimer();
  }

  /**
   * Timer basado en progress.startedAt del backend.
   */
  private setupTimer(resp: WorkoutExerciseDetailResponse): void {
    this.stopTimer();

    this.sessionStartedAtMs = this.resolveSessionStartMs(
      resp.progress?.sessionId ?? this.sessionId,
      resp.progress?.startedAt
    );

    this.updateElapsed();
    if (this.isBrowser) {
      this.timerSub = interval(1000).subscribe(() => this.updateElapsed());
    }
    this.cdr.markForCheck();
  }

  private resolveSessionStartMs(sessionId: number, startedAt: unknown): number {
    const parsed = this.parseStartedAt(startedAt);
    const key = `ws-start-${sessionId}`;
    const storage = this.isBrowser ? sessionStorage : null;

    if (parsed != null) {
      storage?.setItem(key, String(parsed));
      return parsed;
    }

    const stored = storage?.getItem(key);
    if (stored) {
      const ms = Number(stored);
      if (Number.isFinite(ms)) return ms;
    }

    const now = Date.now();
    storage?.setItem(key, String(now));
    return now;
  }

  private updateElapsed(): void {
    if (this.sessionStartedAtMs == null) {
      this.elapsedSeconds = 0;
      this.cdr.markForCheck();
      return;
    }
    const diffMs = Date.now() - this.sessionStartedAtMs;
    this.elapsedSeconds = Math.max(0, Math.floor(diffMs / 1000));
    this.cdr.markForCheck();
  }

  /** Soporta ISO string, timestamp, array u objeto Jackson LocalDateTime. */
  private parseStartedAt(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const ms = Date.parse(value);
      return Number.isNaN(ms) ? null : ms;
    }
    if (Array.isArray(value) && value.length >= 3) {
      const [y, m, d, h = 0, min = 0, s = 0, nano = 0] = value.map(Number);
      const ms = new Date(y, m - 1, d, h, min, s, Math.floor(nano / 1_000_000)).getTime();
      return Number.isNaN(ms) ? null : ms;
    }
    if (typeof value === 'object') {
      const o = value as Record<string, unknown>;
      if ('year' in o) {
        const y = Number(o['year']);
        const m = Number(o['monthValue'] ?? o['month'] ?? 1);
        const d = Number(o['dayOfMonth'] ?? o['day'] ?? 1);
        const h = Number(o['hour'] ?? 0);
        const min = Number(o['minute'] ?? 0);
        const s = Number(o['second'] ?? 0);
        const nano = Number(o['nano'] ?? 0);
        const ms = new Date(y, m - 1, d, h, min, s, Math.floor(nano / 1_000_000)).getTime();
        return Number.isNaN(ms) ? null : ms;
      }
    }
    return null;
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
      const wasCompleted = this.currentSets[index].completed;
      this.currentSets[index].completed = !wasCompleted;
      if (!wasCompleted && this.currentSets[index].completed) {
        this.startRestTimer();
      }
    }
  }

  onTogglePairedSetCompleted(index: number): void {
    if (this.pairedSets[index]) {
      this.pairedSets[index].completed = !this.pairedSets[index].completed;
    }
  }

  onAddPairedSet(): void {
    if (!this.pairedData || this.mutatingPairedSets) return;
    this.mutatingPairedSets = true;
    this.workoutService.addPlannedSet(this.sessionId, this.pairedData.workoutExerciseId).subscribe({
      next: (plannedSets) => {
        this.pairedData!.plannedSets = plannedSets;
        this.pairedSets.push({
          setNumber: this.pairedSets.length + 1,
          reps: null,
          weightKg: null,
          completed: false,
          rirRegistrado: this.pairedData?.plannedRir ?? 2,
        });
        this.pairedDisplayWeights.push(null);
        this.mutatingPairedSets = false;
      },
      error: () => {
        this.mutatingPairedSets = false;
        this.errorMessage = 'No se pudo agregar la serie al ejercicio combinado.';
      },
    });
  }

  onRemovePairedSet(): void {
    if (!this.pairedData || this.mutatingPairedSets || this.pairedSets.length <= 1) return;
    this.mutatingPairedSets = true;
    this.workoutService.removePlannedSet(this.sessionId, this.pairedData.workoutExerciseId).subscribe({
      next: (plannedSets) => {
        this.pairedData!.plannedSets = plannedSets;
        this.pairedSets.pop();
        this.pairedDisplayWeights.pop();
        this.mutatingPairedSets = false;
      },
      error: () => {
        this.mutatingPairedSets = false;
        this.errorMessage = 'No se pudo quitar la serie del ejercicio combinado.';
      },
    });
  }

  onAddSet(): void {
    if (!this.data || this.mutatingSets) return;
    this.mutatingSets = true;
    this.workoutService.addPlannedSet(this.sessionId, this.data.workoutExerciseId).subscribe({
      next: (plannedSets) => {
        this.data!.plannedSets = plannedSets;
        this.currentSets.push({
          setNumber: this.currentSets.length + 1,
          reps: null,
          weightKg: null,
          completed: false,
          rirRegistrado: this.data?.plannedRir ?? 2,
        });
        this.displayWeights.push(null);
        this.mutatingSets = false;
      },
      error: () => {
        this.mutatingSets = false;
        this.errorMessage = 'No se pudo agregar la serie.';
      },
    });
  }

  onRemoveSet(): void {
    if (!this.data || this.mutatingSets || this.currentSets.length <= 1) return;
    this.mutatingSets = true;
    this.workoutService.removePlannedSet(this.sessionId, this.data.workoutExerciseId).subscribe({
      next: (plannedSets) => {
        this.data!.plannedSets = plannedSets;
        this.currentSets.pop();
        this.displayWeights.pop();
        this.mutatingSets = false;
      },
      error: () => {
        this.mutatingSets = false;
        this.errorMessage = 'No se pudo quitar la serie.';
      },
    });
  }

  loadExerciseCatalog(): void {
    if (this.exercises.length > 0 || this.loadingExercises) return;
    this.loadingExercises = true;
    this.createRoutineService.getExercises(0, 200).subscribe({
      next: (resp) => {
        this.exercises = resp.content;
        this.filteredExercises = [...this.exercises];
        this.loadingExercises = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingExercises = false;
        this.cdr.markForCheck();
      },
    });
  }

  openExerciseDropdown(): void {
    this.loadExerciseCatalog();
    this.showExerciseDropdown = true;
    this.filteredExercises = this.newExerciseName.trim()
      ? this.filterExerciseList(this.newExerciseName)
      : [...this.exercises];
    this.cdr.markForCheck();
  }

  closeExerciseDropdown(): void {
    setTimeout(() => {
      this.showExerciseDropdown = false;
      this.cdr.markForCheck();
    }, 150);
  }

  filterExerciseSearch(query: string): void {
    this.newExerciseName = query;
    this.showExerciseDropdown = true;
    this.filteredExercises = this.filterExerciseList(query);
    this.cdr.markForCheck();
  }

  private filterExerciseList(query: string): Exercise[] {
    if (!query.trim()) return [...this.exercises];
    const q = query.toLowerCase();
    return this.exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup?.toLowerCase().includes(q)
    );
  }

  selectExerciseForAdd(exercise: Exercise): void {
    this.newExerciseId = exercise.id;
    this.newExerciseName = exercise.name;
    this.showExerciseDropdown = false;
    this.cdr.markForCheck();
  }

  onAddExercise(): void {
    if (!this.newExerciseId || this.addingExercise) return;
    this.addingExercise = true;
    this.workoutService.addExercise(this.sessionId, { exerciseId: this.newExerciseId }).subscribe({
      next: () => {
        this.addingExercise = false;
        this.newExerciseId = null;
        this.newExerciseName = '';
        this.loadExercise();
      },
      error: () => {
        this.addingExercise = false;
        this.errorMessage = 'No se pudo agregar el ejercicio.';
      },
    });
  }

  onRemoveCurrentExercise(): void {
    if (!this.data || this.removingExercise) return;
    if (!confirm(`¿Eliminar "${this.data.exerciseName}" de esta sesión?`)) return;

    if (this.isCombined) {
      this.uncombine();
    }

    this.removingExercise = true;
    const wasLast = this.isLastExercise;
    const wasOnly = this.data.progress.totalExercises <= 1;

    this.workoutService.removeExercise(this.sessionId, this.data.workoutExerciseId).subscribe({
      next: () => {
        this.removingExercise = false;
        if (wasOnly) {
          this.router.navigate(['/mis-rutinas']);
          return;
        }
        if (wasLast && this.order > 1) {
          this.router.navigate(['/workouts', this.sessionId, 'exercise', this.order - 1]);
        } else {
          this.loadExercise();
        }
      },
      error: () => {
        this.removingExercise = false;
        this.errorMessage = 'No se pudo eliminar el ejercicio.';
      },
    });
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
    if (this.isCombined) {
      return this.data.nextExercises.length <= 1;
    }
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
    if (this.isCombined && !this.pairedData) return;

    this.saving = true;

    const body: WorkoutSetRequest = {
      sets: this.currentSets,
      notes: this.notes
    };

    const savePrimary$ = this.workoutService.saveSets(this.sessionId, this.data.workoutExerciseId, body);
    const save$ = this.isCombined && this.pairedData
      ? savePrimary$.pipe(
          switchMap(() => this.workoutService.saveSets(this.sessionId, this.pairedData!.workoutExerciseId, {
            sets: this.pairedSets,
            notes: this.pairedNotes,
          }))
        )
      : savePrimary$;

    save$.subscribe({
      next: () => {
        this.saving = false;

        if (this.isCombined) {
          this.clearComboState();
        }

        if (this.isLastExercise) {
          this.workoutService.finishSession(this.sessionId).subscribe({
            next: () => {
              this.router.navigate(['/workouts', this.sessionId, 'summary']);
            },
            error: () => {
              this.router.navigate(['/workouts', this.sessionId, 'summary']);
            }
          });
        } else {
          const nextOrder = this.isCombined
            ? this.data!.exerciseOrder + 2
            : this.data!.exerciseOrder + 1;
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

  /** Índices en `nextExercises` visibles para reordenar (oculta el pareja en superset). */
  get reorderableNextIndices(): number[] {
    if (!this.data) return [];
    return this.data.nextExercises
      .map((_, i) => i)
      .filter(i => !(this.isCombined && i === 0));
  }

  get hasMultipleNextExercises(): boolean {
    return this.reorderableNextIndices.length >= 2;
  }

  canReorderNextExercises(): boolean {
    return !this.isCombined && !this.saving && !this.savingReorder && this.hasMultipleNextExercises;
  }

  moveNextExerciseUp(dataIndex: number): void {
    if (!this.data || !this.canReorderNextExercises()) return;

    const visible = this.reorderableNextIndices;
    const pos = visible.indexOf(dataIndex);
    if (pos <= 0) return;

    const arr = [...this.data.nextExercises];
    const swapWith = visible[pos - 1];
    [arr[swapWith], arr[dataIndex]] = [arr[dataIndex], arr[swapWith]];
    this.data = { ...this.data, nextExercises: arr };
    this.reorderDirty = true;
    this.cdr.markForCheck();
  }

  moveNextExerciseDown(dataIndex: number): void {
    if (!this.data || !this.canReorderNextExercises()) return;

    const visible = this.reorderableNextIndices;
    const pos = visible.indexOf(dataIndex);
    if (pos < 0 || pos >= visible.length - 1) return;

    const arr = [...this.data.nextExercises];
    const swapWith = visible[pos + 1];
    [arr[swapWith], arr[dataIndex]] = [arr[dataIndex], arr[swapWith]];
    this.data = { ...this.data, nextExercises: arr };
    this.reorderDirty = true;
    this.cdr.markForCheck();
  }

  onSaveReorder(): void {
    if (!this.data || !this.reorderDirty || this.savingReorder) return;

    this.savingReorder = true;
    const body = {
      workoutExerciseIds: this.data.nextExercises.map(x => x.workoutExerciseId)
    };

    this.workoutService.reorderNextExercises(this.sessionId, body)
      .subscribe({
        next: () => {
          this.savingReorder = false;
          this.reorderDirty = false;
          this.loadExercise();
        },
        error: (err) => {
          console.error(err);
          this.savingReorder = false;
          this.errorMessage = 'No se pudo guardar el nuevo orden de ejercicios.';
          this.cdr.markForCheck();
        }
      });
  }
}
