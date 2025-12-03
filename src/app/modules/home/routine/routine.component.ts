import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeService } from '../services/home.services';
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
    if (!this.routine) return;
    // Aquí luego conectaremos con la pantalla de "sesión de entrenamiento"
    console.log('Empezar rutina', this.routine.id);
  }

  onSessionClick(session: RoutineSessionOverview): void {
    if (!this.routine) return;
    this.router.navigate(['/academia/routines', this.routine.id, 'sessions', session.sessionId]);
  }

  trackByBlock(index: number, block: RoutineBlock): number {
  return block.blockNumber;
}

trackBySession(index: number, session: RoutineSessionOverview): number {
  return session.sessionId;
}

}
