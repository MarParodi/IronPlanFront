import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeService, CurrentRoutineResponse } from '../services/home.services';
import {
  RoutineOverviewResponse,
  RoutineBlock,
  RoutineSessionOverview,
} from '../models/response/routine_overview_response';

@Component({
  selector: 'app-routine-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routine.component.html',
  styleUrls: ['./routine.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutineOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private homeService = inject(HomeService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  routine: RoutineOverviewResponse | null = null;
  loading = true;
  error: string | null = null;
  startingRoutine = false;
  routineStarted = false;

  // Modal de confirmación de cambio de rutina
  showChangeRoutineModal = false;
  currentRoutine: CurrentRoutineResponse | null = null;
  checkingCurrentRoutine = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Rutina no encontrada.';
      this.loading = false;
      return;
    }

    this.homeService.getRoutineOverview(id).subscribe({
      next: (data) => {
        this.routine = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Error al cargar la rutina.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/']); // o donde tengas el listado de rutinas
  }

  onStartRoutine(): void {
    if (!this.routine || this.startingRoutine || this.checkingCurrentRoutine) return;
    
    // Primero verificar si ya tiene una rutina activa
    this.checkingCurrentRoutine = true;
    this.homeService.getCurrentRoutine().subscribe({
      next: (current) => {
        this.checkingCurrentRoutine = false;
        
        // Si tiene rutina activa y es diferente a la que quiere iniciar
        if (current && current.id !== this.routine?.id) {
          this.currentRoutine = current;
          this.showChangeRoutineModal = true;
          this.cdr.markForCheck();
        } else {
          // No tiene rutina o es la misma, proceder directamente
          this.confirmStartRoutine();
        }
      },
      error: () => {
        this.checkingCurrentRoutine = false;
        // Si hay error, intentar iniciar de todos modos
        this.confirmStartRoutine();
      }
    });
  }

  closeChangeRoutineModal(): void {
    this.showChangeRoutineModal = false;
    this.currentRoutine = null;
  }

  confirmStartRoutine(): void {
    if (!this.routine || this.startingRoutine) return;
    
    this.showChangeRoutineModal = false;
    this.startingRoutine = true;
    
    this.homeService.startRoutine(this.routine.id).subscribe({
      next: () => {
        this.routineStarted = true;
        this.startingRoutine = false;
        this.cdr.markForCheck();
        // Navegar a "Mis Rutinas" para ver la rutina activa
        this.router.navigate(['/mis-rutinas']);
      },
      error: (err) => {
        console.error('Error al empezar la rutina', err);
        this.startingRoutine = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSessionClick(session: RoutineSessionOverview): void {
    if (!this.routine) return;
    this.router.navigate(['/academia/routines', this.routine.id, 'sessions', session.sessionId]);
  }

  // ACTUALIZADO: trackBy usa id del bloque
  trackByBlock(index: number, block: RoutineBlock): number {
    return block.id;
  }

  trackBySession(index: number, session: RoutineSessionOverview): number {
    return session.sessionId;
  }
}
