import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateRoutineService } from './services/create-routine.service';
import {
  CreateRoutineRequest,
  CreateSessionRequest,
  CreateExerciseRequest,
  SessionForm,
  ExerciseForm,
  Exercise,
  Goal,
  Level
} from './models/create-routine.models';

@Component({
  selector: 'app-create-routine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-routine.component.html',
  styleUrls: ['./create-routine.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateRoutineComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;

  routineName = '';
  routineDescription = '';
  routineLongDescription = '';
  selectedGoal: Goal | null = null;
  selectedLevel: Level | null = null;
  daysPerWeek = 3;
  durationWeeks = 4;
  isPublic = false;

  sessions: SessionForm[] = [];
  currentSessionIndex = 0;

  exercises: Exercise[] = [];
  exerciseSearch = '';
  filteredExercises: Exercise[] = [];
  loadingExercises = false;

  saving = false;
  error: string | null = null;

  goals: { value: Goal; label: string; icon: string }[] = [
    { value: 'HIPERTROFIA', label: 'Hipertrofia', icon: '💪' },
    { value: 'FUERZA', label: 'Fuerza', icon: '🏋️' },
    { value: 'RESISTENCIA', label: 'Resistencia', icon: '🏃' }
  ];

  levels: { value: Level; label: string }[] = [
    { value: 'NOVATO', label: 'Principiante' },
    { value: 'INTERMEDIO', label: 'Intermedio' },
    { value: 'AVANZADO', label: 'Avanzado' }
  ];

  constructor(
    private createRoutineService: CreateRoutineService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExercises();
    this.initializeDefaultSession();
  }

  loadExercises(): void {
    this.loadingExercises = true;
    this.createRoutineService.getExercises(0, 200).subscribe({
      next: (response) => {
        this.exercises = response.content;
        this.filteredExercises = [...this.exercises];
        this.loadingExercises = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando ejercicios:', err);
        this.loadingExercises = false;
        this.cdr.markForCheck();
      }
    });
  }

  initializeDefaultSession(): void {
    this.sessions = [{
      id: this.generateId(),
      title: '',
      icon: '💪',
      muscles: '',
      description: '',
      exercises: []
    }];
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.cdr.markForCheck();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  validateCurrentStep(): boolean {
    this.error = null;

    if (this.currentStep === 1) {
      if (!this.routineName.trim()) {
        this.error = 'El nombre de la rutina es requerido';
        return false;
      }
      if (!this.routineDescription.trim()) {
        this.error = 'La descripción es requerida';
        return false;
      }
      if (!this.selectedGoal) {
        this.error = 'Selecciona un objetivo';
        return false;
      }
      if (!this.selectedLevel) {
        this.error = 'Selecciona un nivel';
        return false;
      }
    }

    if (this.currentStep === 2) {
      if (this.sessions.length === 0) {
        this.error = 'Debes agregar al menos una sesión';
        return false;
      }
      for (const session of this.sessions) {
        if (!session.title.trim()) {
          this.error = 'Todas las sesiones deben tener un título';
          return false;
        }
      }
    }

    if (this.currentStep === 3) {
      for (const session of this.sessions) {
        if (session.exercises.length === 0) {
          this.error = 'La sesión "' + session.title + '" debe tener al menos un ejercicio';
          return false;
        }
        for (const ex of session.exercises) {
          if (!ex.exerciseId) {
            this.error = 'Todos los ejercicios deben tener un ejercicio seleccionado';
            return false;
          }
        }
      }
    }

    return true;
  }

  addSession(): void {
    this.sessions.push({
      id: this.generateId(),
      title: '',
      icon: '💪',
      muscles: '',
      description: '',
      exercises: []
    });
    this.currentSessionIndex = this.sessions.length - 1;
    this.cdr.markForCheck();
  }

  removeSession(index: number): void {
    if (this.sessions.length > 1) {
      this.sessions.splice(index, 1);
      if (this.currentSessionIndex >= this.sessions.length) {
        this.currentSessionIndex = this.sessions.length - 1;
      }
      this.cdr.markForCheck();
    }
  }

  selectSession(index: number): void {
    this.currentSessionIndex = index;
    this.cdr.markForCheck();
  }

  get currentSession(): SessionForm | null {
    return this.sessions[this.currentSessionIndex] || null;
  }

  addExerciseToSession(): void {
    if (this.currentSession) {
      this.currentSession.exercises.push({
        id: this.generateId(),
        exerciseId: null,
        exerciseName: '',
        displayName: '',
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        rir: 2,
        restMinutes: 2
      });
      this.cdr.markForCheck();
    }
  }

  removeExerciseFromSession(exerciseIndex: number): void {
    if (this.currentSession) {
      this.currentSession.exercises.splice(exerciseIndex, 1);
      this.cdr.markForCheck();
    }
  }

  selectExercise(exerciseForm: ExerciseForm, exercise: Exercise): void {
    exerciseForm.exerciseId = exercise.id;
    exerciseForm.exerciseName = exercise.name;
    exerciseForm.displayName = exercise.name;
    this.exerciseSearch = '';
    this.cdr.markForCheck();
  }

  filterExercises(query: string): void {
    this.exerciseSearch = query;
    if (!query.trim()) {
      this.filteredExercises = [...this.exercises];
    } else {
      const q = query.toLowerCase();
      this.filteredExercises = this.exercises.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup?.toLowerCase().includes(q)
      );
    }
    this.cdr.markForCheck();
  }

  saveRoutine(): void {
    if (!this.validateCurrentStep()) return;

    this.saving = true;
    this.error = null;

    const request: CreateRoutineRequest = {
      name: this.routineName.trim(),
      description: this.routineDescription.trim(),
      longDescription: this.routineLongDescription.trim() || undefined,
      goal: this.selectedGoal!,
      suggestedLevel: this.selectedLevel!,
      daysPerWeek: this.daysPerWeek,
      durationWeeks: this.durationWeeks,
      isPublic: this.isPublic,
      sessions: this.sessions.map((session, sessionIndex) => this.mapSessionToRequest(session, sessionIndex))
    };

    this.createRoutineService.createRoutine(request).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/perfil']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creando rutina:', err);
        this.error = err.error?.message || 'Error al crear la rutina';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mapSessionToRequest(session: SessionForm, sessionIndex: number): CreateSessionRequest {
    return {
      title: session.title.trim(),
      icon: session.icon || '💪',
      muscles: session.muscles?.trim() || '',
      description: session.description?.trim() || '',
      blockNumber: 1,
      blockLabel: 'Semana 1-' + this.durationWeeks,
      orderInBlock: sessionIndex + 1,
      exercises: session.exercises.map((ex, exIndex) => this.mapExerciseToRequest(ex, exIndex))
    };
  }

  private mapExerciseToRequest(exercise: ExerciseForm, exerciseIndex: number): CreateExerciseRequest {
    return {
      exerciseId: exercise.exerciseId!,
      displayName: exercise.displayName?.trim() || undefined,
      exerciseOrder: exerciseIndex + 1,
      sets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      rir: exercise.rir || undefined,
      restMinutes: exercise.restMinutes || undefined
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.prevStep();
    } else {
      this.router.navigate(['/academia']);
    }
  }
}
