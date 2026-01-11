import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomSessionService } from './services/custom-session.service';
import { WorkoutService } from '../workout/services/workout.services';
import {
  CatalogExercise,
  CustomExerciseItem,
  CustomExerciseRequest
} from './models/custom-session.models';
import { debounceTime, Subject, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-custom-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-session.component.html',
  styleUrl: './custom-session.component.css'
})
export class CustomSessionComponent implements OnInit {
  private router = inject(Router);
  private customService = inject(CustomSessionService);
  private workoutService = inject(WorkoutService);

  // Exponer Math para el template
  Math = Math;

  // Estado de la vista
  step = signal<'select' | 'configure' | 'starting'>('select');

  // Nombre de la sesión personalizada
  sessionName = signal('');

  // Catálogo de ejercicios
  catalogExercises = signal<CatalogExercise[]>([]);
  loadingCatalog = signal(false);
  searchQuery = signal('');
  private searchSubject = new Subject<string>();

  // Ejercicios seleccionados
  selectedExercises = signal<CustomExerciseItem[]>([]);

  // Modal de configuración de ejercicio
  showConfigModal = signal(false);
  exerciseToConfig = signal<CatalogExercise | null>(null);
  configSets = signal(3);
  configRepsMin = signal(8);
  configRepsMax = signal(12);
  configRir = signal(2);
  configRestMinutes = signal(2);

  // Error y loading
  error = signal<string | null>(null);
  starting = signal(false);

  // Computed
  totalSeries = computed(() =>
    this.selectedExercises().reduce((acc, ex) => acc + ex.sets, 0)
  );

  estimatedMinutes = computed(() => {
    const exercises = this.selectedExercises();
    let total = 0;
    for (const ex of exercises) {
      // ~1.5 min por serie + descanso
      total += ex.sets * (1.5 + ex.restMinutes);
    }
    return Math.round(total);
  });

  ngOnInit(): void {
    this.loadInitialExercises();
    this.setupSearch();
  }

  private loadInitialExercises(): void {
    this.loadingCatalog.set(true);
    this.customService.getExercises(0, 50).subscribe({
      next: (res) => {
        this.catalogExercises.set(res.content);
        this.loadingCatalog.set(false);
      },
      error: (err) => {
        console.error('Error cargando ejercicios:', err);
        this.loadingCatalog.set(false);
      }
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        if (!query.trim()) {
          return this.customService.getExercises(0, 50);
        }
        return this.customService.searchExercises(query);
      })
    ).subscribe({
      next: (res) => {
        this.catalogExercises.set(res.content);
        this.loadingCatalog.set(false);
      },
      error: () => {
        this.loadingCatalog.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.loadingCatalog.set(true);
    this.searchSubject.next(query);
  }

  // Verificar si un ejercicio ya está seleccionado
  isExerciseSelected(exerciseId: number): boolean {
    return this.selectedExercises().some(ex => ex.exerciseId === exerciseId);
  }

  // Abrir modal de configuración
  openConfigModal(exercise: CatalogExercise): void {
    this.exerciseToConfig.set(exercise);
    // Valores por defecto
    this.configSets.set(3);
    this.configRepsMin.set(8);
    this.configRepsMax.set(12);
    this.configRir.set(2);
    this.configRestMinutes.set(2);
    this.showConfigModal.set(true);
  }

  closeConfigModal(): void {
    this.showConfigModal.set(false);
    this.exerciseToConfig.set(null);
  }

  confirmAddExercise(): void {
    const exercise = this.exerciseToConfig();
    if (!exercise) return;

    const newItem: CustomExerciseItem = {
      tempId: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      sets: this.configSets(),
      repsMin: this.configRepsMin(),
      repsMax: this.configRepsMax(),
      rir: this.configRir(),
      restMinutes: this.configRestMinutes()
    };

    this.selectedExercises.update(list => [...list, newItem]);
    this.closeConfigModal();
  }

  // Quitar ejercicio de la lista
  removeExercise(tempId: string): void {
    this.selectedExercises.update(list =>
      list.filter(ex => ex.tempId !== tempId)
    );
  }

  // Mover ejercicio arriba/abajo
  moveExerciseUp(index: number): void {
    if (index <= 0) return;
    this.selectedExercises.update(list => {
      const newList = [...list];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList;
    });
  }

  moveExerciseDown(index: number): void {
    const list = this.selectedExercises();
    if (index >= list.length - 1) return;
    this.selectedExercises.update(list => {
      const newList = [...list];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList;
    });
  }

  // Editar ejercicio ya agregado
  editExercise(item: CustomExerciseItem): void {
    // Crear un ejercicio falso para el modal
    const fakeExercise: CatalogExercise = {
      id: item.exerciseId,
      name: item.exerciseName,
      primaryMuscle: item.primaryMuscle
    };
    this.exerciseToConfig.set(fakeExercise);
    this.configSets.set(item.sets);
    this.configRepsMin.set(item.repsMin);
    this.configRepsMax.set(item.repsMax);
    this.configRir.set(item.rir);
    this.configRestMinutes.set(item.restMinutes);

    // Quitar el ejercicio actual (se reemplazará)
    this.removeExercise(item.tempId);
    this.showConfigModal.set(true);
  }

  // Navegar atrás
  onBack(): void {
    if (this.step() === 'configure') {
      this.step.set('select');
    } else {
      this.router.navigate(['/mis-rutinas']);
    }
  }

  // Ir al paso de configuración/resumen
  goToReview(): void {
    if (this.selectedExercises().length === 0) {
      this.error.set('Selecciona al menos un ejercicio');
      return;
    }
    this.error.set(null);
    this.step.set('configure');
  }

  // Iniciar la sesión personalizada
  startSession(): void {
    if (this.starting()) return;

    this.starting.set(true);
    this.error.set(null);

    const exercises: CustomExerciseRequest[] = this.selectedExercises().map((ex, index) => ({
      exerciseId: ex.exerciseId,
      orderIndex: index + 1,
      plannedSets: ex.sets,
      plannedRepsMin: ex.repsMin,
      plannedRepsMax: ex.repsMax,
      plannedRir: ex.rir,
      plannedRestSeconds: ex.restMinutes * 60
    }));

    const title = this.sessionName().trim() || undefined;

    this.customService.startCustomSession({ title, exercises }).subscribe({
      next: (resp) => {
        this.starting.set(false);
        // Navegar al primer ejercicio
        this.router.navigate(['/workouts', resp.sessionId, 'exercise', 1]);
      },
      error: (err) => {
        console.error('Error iniciando sesión:', err);
        this.error.set('No se pudo iniciar la sesión. Intenta de nuevo.');
        this.starting.set(false);
      }
    });
  }

  // TrackBy
  trackByExerciseId = (_: number, ex: CatalogExercise) => ex.id;
  trackByTempId = (_: number, ex: CustomExerciseItem) => ex.tempId;
}
