import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomeService } from './services/home.services';
import { CardsPage, Card, Goal } from './models/response/card_response';
import { RoutineDetailResponse } from './models/response/detail_routine_response';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  // DI
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _homeService = inject(HomeService);

  // lifecycle
  private readonly destroy$ = new Subject<void>();
  backendBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  // UI state
  loading = false;
  errorMsg = '';

  // data
  cardsList: Card[] = [];
  totalPages = 0;

  // query state
  page = 0;              // 0-based
  size = 12;
  sort = 'name,asc';     // name,asc | name,desc | id,desc (recientes)
  goalFilter: Goal | null = null;

  ngOnInit(): void {
    // Si deseas leer filtros desde queryParams, descomenta:
    // this._route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(q => {
    //   this.page = Number(q.get('page')) || 0;
    //   this.size = Number(q.get('size')) || 12;
    //   this.sort = q.get('sort') || 'name,asc';
    //   this.goalFilter = (q.get('goal') as Goal) || null;
    //   this.load();
    // });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----- Data loading -----
  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this._homeService
      .getCardsPage({
        page: this.page,
        size: this.size,
        sort: this.sort,
        goal: this.goalFilter ?? undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p: CardsPage) => {
          this.cardsList = p.content;
          this.totalPages = p.totalPages;
          this._cdr.markForCheck();
        },
        error: () => {
          this.errorMsg = 'Error al cargar rutinas';
          alert(this.errorMsg);
          this._cdr.markForCheck();
        },
        complete: () => {
          this.loading = false;
          this._cdr.markForCheck();
        },
      });
  }

  // ----- UI events -----
  onSelectGoal(goal: Goal | null): void {
    this.goalFilter = goal;
    this.page = 0;
    this.load();
  }

  onSortChange(sort: string): void {
    this.sort = sort;
    this.page = 0;
    this.load();
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages) return;
    this.page = nextPage;
    this.load();
  }

// Detalle de rutina (para el modal)
detailOpen = false;
detailLoading = false;
detailError: string | null = null;
selectedRoutine: RoutineDetailResponse | null = null;

onDetails(card: Card): void {
  this.detailOpen = true;
  this.detailLoading = true;
  this.detailError = null;
  this.selectedRoutine = null;

  this._homeService.getRoutineDetail(card.id).subscribe({
    next: (detail) => {
      this.selectedRoutine = detail;
      this.detailLoading = false;
      this._cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error al cargar el detalle de la rutina', err);
      this.detailError = 'No se pudo cargar el detalle de la rutina.';
      this.detailLoading = false;
      this._cdr.markForCheck();
    },
  });
}
onStartRoutine(routine: { id: string | number; accessType: string }): void {
  if (routine.accessType === 'XP_UNLOCK') {
    console.log('Intentar desbloquear con XP');
    // Aquí luego pondremos el modal de "¿Deseas usar XP?"
    return;
  }

  // FREE → navegar automáticamente al overview
  this._router.navigate(['/routines', routine.id]);
}



closeDetail(): void {
  this.detailOpen = false;
  this.selectedRoutine = null;
  this.detailError = null;
}


  // ----- Template helpers -----
  trackByCard = (_: number, c: Card) => c.id;
}
