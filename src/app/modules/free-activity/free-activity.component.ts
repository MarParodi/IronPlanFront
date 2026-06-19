import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FreeActivityService } from './services/free-activity.service';
import { FreeActivityResponse, FreeActivityType } from './models/free-activity.models';
import { CreateRoutineService } from '../create-routine/services/create-routine.service';

@Component({
  selector: 'app-free-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './free-activity.component.html',
})
export class FreeActivityComponent implements OnInit, OnDestroy {
  private freeActivityService = inject(FreeActivityService);
  private createRoutineService = inject(CreateRoutineService);
  private router = inject(Router);

  activityTypes: { label: string; value: FreeActivityType }[] = [
    { label: 'Caminadora', value: 'CAMINADORA' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Bicicleta estática', value: 'BICICLETA_ESTATICA' },
    { label: 'Natación', value: 'NATACION' },
    { label: 'Otra', value: 'OTRA' },
  ];

  form = {
    activityType: 'RUNNING' as FreeActivityType,
    activityTypeOther: '',
    distance: null as number | null,
    durationMinutes: 0,
    durationSeconds: 0,
    notes: '',
  };

  distanceUnit: 'KM' | 'MI' = 'KM';
  useManualDuration = false;
  timerRunning = false;
  timerSeconds = 0;
  private timerInterval?: ReturnType<typeof setInterval>;

  selectedFile: File | null = null;
  photoPreview: string | null = null;
  uploadedPhotoUrl: string | null = null;

  mine: FreeActivityResponse[] = [];
  loadingMine = false;
  saving = false;
  error: string | null = null;
  success = false;

  ngOnInit(): void {
    this.loadMine();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadMine(): void {
    this.loadingMine = true;
    this.freeActivityService.getMine().subscribe({
      next: (items) => {
        this.mine = items;
        this.loadingMine = false;
      },
      error: () => {
        this.loadingMine = false;
      },
    });
  }

  toggleTimer(): void {
    if (this.timerRunning) {
      this.stopTimer();
      this.syncManualDurationFromTimer();
    } else {
      this.timerRunning = true;
      this.timerInterval = setInterval(() => {
        this.timerSeconds += 1;
      }, 1000);
    }
  }

  resetTimer(): void {
    this.stopTimer();
    this.timerSeconds = 0;
    this.form.durationMinutes = 0;
    this.form.durationSeconds = 0;
  }

  private stopTimer(): void {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private syncManualDurationFromTimer(): void {
    this.form.durationMinutes = Math.floor(this.timerSeconds / 60);
    this.form.durationSeconds = this.timerSeconds % 60;
    this.useManualDuration = true;
  }

  get timerLabel(): string {
    const total = this.useManualDuration
      ? this.form.durationMinutes * 60 + this.form.durationSeconds
      : this.timerSeconds;
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.photoPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  private getDurationSeconds(): number {
    if (this.useManualDuration) {
      return Math.max(1, this.form.durationMinutes * 60 + this.form.durationSeconds);
    }
    return Math.max(1, this.timerSeconds);
  }

  private getDistanceKm(): number | null {
    if (this.form.distance == null || this.form.distance <= 0) return null;
    return this.distanceUnit === 'MI'
      ? this.form.distance * 1.60934
      : this.form.distance;
  }

  submit(): void {
    this.error = null;
    this.success = false;

    if (this.form.activityType === 'OTRA' && !this.form.activityTypeOther.trim()) {
      this.error = 'Describe el tipo de actividad.';
      return;
    }

    const durationSeconds = this.getDurationSeconds();
    if (durationSeconds < 1) {
      this.error = 'Indica una duración válida.';
      return;
    }

    this.saving = true;

    const saveActivity = (photoUrl: string | null) => {
      this.freeActivityService.create({
        activityType: this.form.activityType,
        activityTypeOther:
          this.form.activityType === 'OTRA' ? this.form.activityTypeOther.trim() : null,
        distanceKm: this.getDistanceKm(),
        durationSeconds,
        photoUrl,
        notes: this.form.notes.trim() || null,
      }).subscribe({
        next: () => {
          this.saving = false;
          this.success = true;
          this.resetTimer();
          this.form.distance = null;
          this.form.notes = '';
          this.selectedFile = null;
          this.photoPreview = null;
          this.uploadedPhotoUrl = null;
          this.loadMine();
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message || 'No se pudo registrar la actividad.';
        },
      });
    };

    if (this.selectedFile) {
      this.createRoutineService.uploadRoutineImage(this.selectedFile).subscribe({
        next: (res) => saveActivity(res.url),
        error: () => {
          this.saving = false;
          this.error = 'No se pudo subir la foto.';
        },
      });
    } else {
      saveActivity(null);
    }
  }

  formatDuration(seconds: number): string {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm} min ${ss} s`;
  }

  getActivityLabel(type: FreeActivityType, other: string | null): string {
    const found = this.activityTypes.find((t) => t.value === type);
    if (type === 'OTRA' && other) return other;
    return found?.label ?? type;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
