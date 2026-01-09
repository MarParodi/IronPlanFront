import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { MyRoutineItem } from '../models/my-routines.models';

@Component({
  selector: 'app-my-created-routines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-created-routines.component.html',
  styleUrls: ['./my-created-routines.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyCreatedRoutinesComponent implements OnInit {
  routines: MyRoutineItem[] = [];
  loading = true;
  error: string | null = null;
  
  // Paginación
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;

  // Estado de eliminación
  deletingId: number | null = null;
  showDeleteConfirm = false;
  routineToDelete: MyRoutineItem | null = null;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoutines();
  }

  loadRoutines(page: number = 0): void {
    this.loading = true;
    this.error = null;
    this.currentPage = page;

    this.profileService.getMyCreatedRoutines(page, this.pageSize).subscribe({
      next: (response) => {
        this.routines = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando rutinas:', err);
        this.error = 'No se pudieron cargar tus rutinas';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Navegación
  goBack(): void {
    this.router.navigate(['/perfil']);
  }

  goToRoutineDetail(routineId: number): void {
    this.router.navigate(['/routines', routineId]);
  }

  goToCreateRoutine(): void {
    this.router.navigate(['/crear']);
  }

  // Paginación
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadRoutines(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.loadRoutines(this.currentPage - 1);
    }
  }

  // Eliminar rutina
  confirmDelete(routine: MyRoutineItem, event: Event): void {
    event.stopPropagation();
    this.routineToDelete = routine;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.routineToDelete = null;
    this.showDeleteConfirm = false;
    this.cdr.markForCheck();
  }

  deleteRoutine(): void {
    if (!this.routineToDelete) return;

    this.deletingId = this.routineToDelete.id;
    
    this.profileService.deleteRoutine(this.routineToDelete.id).subscribe({
      next: () => {
        // Remover de la lista local
        this.routines = this.routines.filter(r => r.id !== this.deletingId);
        this.totalElements--;
        this.deletingId = null;
        this.showDeleteConfirm = false;
        this.routineToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error eliminando rutina:', err);
        this.deletingId = null;
        this.showDeleteConfirm = false;
        this.routineToDelete = null;
        this.cdr.markForCheck();
      }
    });
  }

  // Helpers
  getGoalLabel(goal: string): string {
    const goals: Record<string, string> = {
      'HYPERTROPHY': 'Hipertrofia',
      'STRENGTH': 'Fuerza',
      'ENDURANCE': 'Resistencia',
      'GENERAL': 'General'
    };
    return goals[goal] || goal;
  }

  getLevelLabel(level: string): string {
    const levels: Record<string, string> = {
      'BEGINNER': 'Principiante',
      'INTERMEDIATE': 'Intermedio',
      'ADVANCED': 'Avanzado'
    };
    return levels[level] || level;
  }

  getStatusLabel(status: string): string {
    const statuses: Record<string, string> = {
      'DRAFT': 'Borrador',
      'PUBLISHED': 'Publicado',
      'ARCHIVED': 'Archivado'
    };
    return statuses[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'DRAFT': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      'PUBLISHED': 'text-teal-400 bg-teal-400/10 border-teal-400/30',
      'ARCHIVED': 'text-slate-400 bg-slate-400/10 border-slate-400/30'
    };
    return colors[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  trackByRoutine(index: number, routine: MyRoutineItem): number {
    return routine.id;
  }
}

