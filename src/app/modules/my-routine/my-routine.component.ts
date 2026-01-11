import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { 
  HomeService, 
  ActiveRoutineResponse, 
  ActiveRoutineBlock, 
  ActiveRoutineSession 
} from '../home/services/home.services';

@Component({
  selector: 'app-my-routine',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './my-routine.component.html',
  styleUrls: ['./my-routine.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRoutineComponent implements OnInit {
  private router = inject(Router);
  private homeService = inject(HomeService);
  private cdr = inject(ChangeDetectorRef);

  routine: ActiveRoutineResponse | null = null;
  loading = true;
  error: string | null = null;
  stopping = false;
  showDetail = false;
  stopConfirmOpen = false;

  // Sesión seleccionada (highlight)
  selectedSessionId: number | null = null;

  ngOnInit(): void {
    this.loadActiveRoutine();
  }

  loadActiveRoutine(): void {
    this.loading = true;
    this.homeService.getActiveRoutineWithProgress().subscribe({
      next: (data) => {
        this.routine = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar rutina activa', err);
        if (err.status === 204 || err.status === 404) {
          // No tiene rutina activa
          this.routine = null;
        } else {
          this.error = 'Error al cargar tu rutina.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/academia']);
  }

    openStopConfirm(): void {
    if (this.stopping) return;
    this.stopConfirmOpen = true;
    this.cdr.markForCheck();
  }

  closeStopConfirm(): void {
    this.stopConfirmOpen = false;
    this.cdr.markForCheck();
  }

  confirmStopRoutine(): void {
    this.stopConfirmOpen = false;
    this.cdr.markForCheck();
    this.onStopRoutine(); // reutiliza tu lógica actual
  }


    onStopRoutine(): void {
    if (this.stopping) return;

    this.stopping = true;
    this.stopConfirmOpen = false; // por si acaso
    this.cdr.markForCheck();

    this.homeService.stopRoutine().subscribe({
      next: () => {
        this.stopping = false;
        this.routine = null;
        this.showDetail = false;
        this.stopConfirmOpen = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.stopping = false;
        this.stopConfirmOpen = false;
        this.cdr.markForCheck();
      }
    });
  }


  goToExplore(): void {
    this.router.navigate(['/academia']);
  }

  goToCustomSession(): void {
    this.router.navigate(['/sesion-personalizada']);
  }

  getDaysPerWeek(): number {
    return this.routine?.daysPerWeek ?? 0;
  }

  onSessionClick(session: ActiveRoutineSession): void {
    this.selectedSessionId = session.sessionId;
    this.cdr.markForCheck();
    // Aquí podrías navegar al detalle de la sesión o iniciar el workout
  }

  onStartSession(session: ActiveRoutineSession): void {
    if (!this.routine) return;
    // Navegar a iniciar el workout
    this.router.navigate(['/academia/routines', this.routine.id, 'sessions', session.sessionId]);
  }

  // Drag and drop para reordenar sesiones dentro de un bloque
  // ACTUALIZADO: Ahora usa blockId en lugar de blockNumber
  dropSession(event: CdkDragDrop<ActiveRoutineSession[]>, block: ActiveRoutineBlock): void {
    if (event.previousIndex !== event.currentIndex && this.routine) {
      moveItemInArray(block.sessions, event.previousIndex, event.currentIndex);
      
      // Actualizar sessionOrder localmente
      block.sessions.forEach((s, idx) => {
        s.sessionOrder = idx + 1;
      });
      
      // Enviar al backend el nuevo orden usando blockId
      const sessionIds = block.sessions.map(s => s.sessionId);
      this.homeService.reorderSessions(this.routine.id, block.blockId, sessionIds).subscribe({
        next: () => {
          console.log('Orden guardado correctamente');
        },
        error: (err) => {
          console.error('Error al guardar el orden', err);
          // Recargar para restaurar el orden original
          this.loadActiveRoutine();
        }
      });
      
      this.cdr.markForCheck();
    }
  }

  // ACTUALIZADO: trackBy usa blockId en lugar de blockNumber
  trackByBlock(index: number, block: ActiveRoutineBlock): number {
    return block.blockId;
  }

  trackBySession(index: number, session: ActiveRoutineSession): number {
    return session.sessionId;
  }

  // Obtener la sesión seleccionada
  getSelectedSession(): ActiveRoutineSession | null {
    if (!this.routine || !this.selectedSessionId) return null;
    
    for (const block of this.routine.blocks) {
      const session = block.sessions.find(s => s.sessionId === this.selectedSessionId);
      if (session) return session;
    }
    return null;
  }
}
