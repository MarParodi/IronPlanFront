import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateRoutineService } from './services/create-routine.service';
import {
  CreateRoutineRequest,
  CreateBlockRequest,
  CreateSessionRequest,
  CreateExerciseRequest,
  BlockForm,
  SessionForm,
  ExerciseForm,
  Exercise,
  Goal,
  Level,
  RoutineGender
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
  totalSteps = 4; // Ahora son 4 pasos

  // Step 1: Info básica
  routineName = '';
  routineDescription = '';
  routineLongDescription = '';
  selectedGoal: Goal | null = null;
  selectedLevel: Level | null = null;
  selectedGender: RoutineGender = 'UNISEX';
  daysPerWeek = 3;
  durationWeeks = 4;
  isPublic = false;

// Imagen (Cloudinary)
routineImagePreview: string | null = null;
routineImageUrl: string | null = null;
uploadingRoutineImage = false;
routineImageError: string | null = null;


  // Step 2: Bloques
  blocks: BlockForm[] = [];
  currentBlockIndex = 0;

  // Step 3 & 4: Sesiones y Ejercicios
  currentSessionIndex = 0;

  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  loadingExercises = false;
  
  // Control del dropdown de ejercicios - ID del ejercicio con dropdown abierto
  activeDropdownId: string | null = null;

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

  genders: { value: RoutineGender; label: string; icon: string }[] = [
    { value: 'MUJER', label: 'Mujer', icon: '♀' },
    { value: 'HOMBRE', label: 'Hombre', icon: '♂' },
    { value: 'UNISEX', label: 'Unisex', icon: '⚥' }
  ];

  constructor(
    private createRoutineService: CreateRoutineService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadExercises();
    this.initializeDefaultBlock();
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

  //cargar imagen
  onRoutineImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Preview local (igual que profile)
  this.routineImagePreview = URL.createObjectURL(file);
  this.uploadingRoutineImage = true;
  this.routineImageError = null;

  this.createRoutineService.uploadRoutineImage(file).subscribe({
    next: (res) => {
      this.routineImageUrl = res.url;
      this.uploadingRoutineImage = false;
    },
    error: () => {
      this.uploadingRoutineImage = false;
      this.routineImageError = 'Error al subir la imagen';
    }
  });
}


  initializeDefaultBlock(): void {
    this.blocks = [{
      id: this.generateId(),
      name: 'Bloque 1',
      description: '',
      durationWeeks: this.durationWeeks,
      sessions: [{
        id: this.generateId(),
        title: '',
        icon: '💪',
        muscles: '',
        description: '',
        exercises: []
      }]
    }];
  }

  // ============ NAVEGACIÓN ============

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
      // Validar bloques
      if (this.blocks.length === 0) {
        this.error = 'Debes tener al menos un bloque';
        return false;
      }
      
      const totalBlockWeeks = this.getTotalBlockWeeks();
      const totalDuration = Number(this.durationWeeks);
      
      if (totalBlockWeeks > totalDuration) {
        this.error = `La suma de semanas de los bloques (${totalBlockWeeks}) excede la duración total (${totalDuration} semanas)`;
        return false;
      }
      
      if (totalBlockWeeks < totalDuration) {
        this.error = `La suma de semanas de los bloques (${totalBlockWeeks}) es menor que la duración total (${totalDuration} semanas). Ajusta la duración de los bloques.`;
        return false;
      }

      for (const block of this.blocks) {
        if (!block.name.trim()) {
          this.error = 'Todos los bloques deben tener un nombre';
          return false;
        }
        if (Number(block.durationWeeks) < 1) {
          this.error = 'Todos los bloques deben tener al menos 1 semana de duración';
          return false;
        }
      }
    }

    if (this.currentStep === 3) {
      // Validar que cada bloque tenga al menos una sesión con título
      for (const block of this.blocks) {
        if (block.sessions.length === 0) {
          this.error = `El bloque "${block.name}" debe tener al menos una sesión`;
          return false;
        }
        for (const session of block.sessions) {
          if (!session.title.trim()) {
            this.error = `Todas las sesiones del bloque "${block.name}" deben tener un título`;
            return false;
          }
        }
      }
    }

    if (this.currentStep === 4) {
      // Validar ejercicios
      for (const block of this.blocks) {
        for (const session of block.sessions) {
          if (session.exercises.length === 0) {
            this.error = `La sesión "${session.title}" del bloque "${block.name}" debe tener al menos un ejercicio`;
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
    }

    return true;
  }

  // ============ BLOQUES ============

  get currentBlock(): BlockForm | null {
    return this.blocks[this.currentBlockIndex] || null;
  }

  getTotalBlockWeeks(): number {
    return this.blocks.reduce((sum, block) => sum + Number(block.durationWeeks), 0);
  }

  getRemainingWeeks(): number {
    return Number(this.durationWeeks) - this.getTotalBlockWeeks();
  }

  addBlock(): void {
    const remaining = this.getRemainingWeeks();
    if (remaining <= 0) {
      this.error = 'No quedan semanas disponibles para agregar más bloques';
      this.cdr.markForCheck();
      return;
    }

    // Calcular semanas por defecto para el nuevo bloque (mínimo 1, máximo lo que quede o 4)
    const defaultWeeks = Math.min(remaining, 4);

    this.blocks.push({
      id: this.generateId(),
      name: `Bloque ${this.blocks.length + 1}`,
      description: '',
      durationWeeks: defaultWeeks,
      sessions: [{
        id: this.generateId(),
        title: '',
        icon: '💪',
        muscles: '',
        description: '',
        exercises: []
      }]
    });
    this.currentBlockIndex = this.blocks.length - 1;
    this.error = null;
    this.cdr.markForCheck();
  }

  removeBlock(index: number): void {
    if (this.blocks.length > 1) {
      this.blocks.splice(index, 1);
      if (this.currentBlockIndex >= this.blocks.length) {
        this.currentBlockIndex = this.blocks.length - 1;
      }
      this.cdr.markForCheck();
    }
  }

  selectBlock(index: number): void {
    this.currentBlockIndex = index;
    this.currentSessionIndex = 0;
    this.cdr.markForCheck();
  }

  onDurationWeeksChange(): void {
    // Asegurar que sea número
    this.durationWeeks = Number(this.durationWeeks);
    
    // Cuando cambia la duración total, ajustar el primer bloque si es necesario
    if (this.blocks.length === 1) {
      this.blocks[0].durationWeeks = this.durationWeeks;
    }
    this.cdr.markForCheck();
  }

  onBlockDurationChange(block: BlockForm): void {
    // Asegurar que sea número
    block.durationWeeks = Number(block.durationWeeks);
    
    // Validar que no exceda el total
    const total = this.getTotalBlockWeeks();
    if (total > Number(this.durationWeeks)) {
      // Ajustar automáticamente
      const excess = total - Number(this.durationWeeks);
      block.durationWeeks = Math.max(1, block.durationWeeks - excess);
    }
    this.cdr.markForCheck();
  }

  // ============ SESIONES ============

  get currentSession(): SessionForm | null {
    if (!this.currentBlock) return null;
    return this.currentBlock.sessions[this.currentSessionIndex] || null;
  }

  get allSessions(): { block: BlockForm; session: SessionForm; blockIndex: number; sessionIndex: number }[] {
    const result: { block: BlockForm; session: SessionForm; blockIndex: number; sessionIndex: number }[] = [];
    this.blocks.forEach((block, blockIndex) => {
      block.sessions.forEach((session, sessionIndex) => {
        result.push({ block, session, blockIndex, sessionIndex });
      });
    });
    return result;
  }

  // Verifica si se pueden agregar más sesiones al bloque actual
  canAddSessionToCurrentBlock(): boolean {
    if (!this.currentBlock) return false;
    return this.currentBlock.sessions.length < Number(this.daysPerWeek);
  }

  // Obtiene cuántas sesiones faltan por agregar en el bloque actual
  getRemainingSessionsForCurrentBlock(): number {
    if (!this.currentBlock) return 0;
    return Number(this.daysPerWeek) - this.currentBlock.sessions.length;
  }

  // Verifica si un bloque específico puede tener más sesiones
  canAddSessionToBlock(block: BlockForm): boolean {
    return block.sessions.length < Number(this.daysPerWeek);
  }

  addSession(): void {
    if (!this.currentBlock) return;
    
    // Validar que no exceda los días por semana
    if (!this.canAddSessionToCurrentBlock()) {
      this.error = `No puedes agregar más de ${this.daysPerWeek} sesiones por bloque (días por semana)`;
      this.cdr.markForCheck();
      return;
    }

    this.error = null;
    this.currentBlock.sessions.push({
      id: this.generateId(),
      title: '',
      icon: '💪',
      muscles: '',
      description: '',
      exercises: []
    });
    this.currentSessionIndex = this.currentBlock.sessions.length - 1;
    this.cdr.markForCheck();
  }

  removeSession(sessionIndex: number): void {
    if (this.currentBlock && this.currentBlock.sessions.length > 1) {
      this.currentBlock.sessions.splice(sessionIndex, 1);
      if (this.currentSessionIndex >= this.currentBlock.sessions.length) {
        this.currentSessionIndex = this.currentBlock.sessions.length - 1;
      }
      this.cdr.markForCheck();
    }
  }

  selectSession(blockIndex: number, sessionIndex: number): void {
    this.currentBlockIndex = blockIndex;
    this.currentSessionIndex = sessionIndex;
    this.activeDropdownId = null;
    this.cdr.markForCheck();
  }

  // ============ EJERCICIOS ============

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

  // Métodos para el dropdown de ejercicios
  selectExercise(exerciseForm: ExerciseForm, exercise: Exercise): void {
    exerciseForm.exerciseId = exercise.id;
    exerciseForm.exerciseName = exercise.name;
    exerciseForm.displayName = exercise.name;
    this.activeDropdownId = null;
    this.cdr.markForCheck();
  }

  openDropdown(exerciseFormId: string): void {
    this.activeDropdownId = exerciseFormId;
    this.filteredExercises = [...this.exercises];
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.activeDropdownId = null;
      this.cdr.markForCheck();
    }, 150);
  }

  filterExercises(query: string, exerciseFormId: string): void {
    this.activeDropdownId = exerciseFormId;
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

  isDropdownOpen(exerciseFormId: string): boolean {
    return this.activeDropdownId === exerciseFormId;
  }

  // ============ GUARDAR ============

  saveRoutine(): void {
    if (!this.validateCurrentStep()) return;

    this.saving = true;
    this.error = null;

    // Crear la estructura con bloques
    const blocksRequest: CreateBlockRequest[] = this.blocks.map((block, blockIndex) => ({
      name: block.name.trim(),
      description: block.description?.trim() || undefined,
      orderIndex: blockIndex + 1,
      durationWeeks: block.durationWeeks,
      sessions: block.sessions.map((session, sessionIndex) => this.mapSessionToRequest(session, sessionIndex))
    }));

    const request: CreateRoutineRequest = {
      name: this.routineName.trim(),
      description: this.routineDescription.trim(),
      longDescription: this.routineLongDescription.trim() || undefined,
      img: this.routineImageUrl || undefined,
      goal: this.selectedGoal!,
      suggestedLevel: this.selectedLevel!,
      daysPerWeek: this.daysPerWeek,
      durationWeeks: this.durationWeeks,
      routineGender: this.selectedGender,
      isPublic: this.isPublic,
      blocks: blocksRequest
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
      sessionOrder: sessionIndex + 1,
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
