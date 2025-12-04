import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomeService } from './services/home.services';
import { CardsPage, Card, Goal } from './models/response/card_response';
import { RoutineDetailResponse } from './models/response/detail_routine_response';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  private readonly searchSubject$ = new Subject<string>();
  backendBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  // UI state
  loading = false;
  errorMsg = '';
  searchFocused = false;

  // data
  cardsList: Card[] = [];
  filteredCards: Card[] = [];
  totalPages = 0;

  // query state
  page = 0;
  size = 12;
  sort = 'id,desc';     // Por defecto: recientes
  goalFilter: Goal | null = null;
  daysFilter: number | null = null;
  searchQuery = '';

  // Opciones de días por semana
  daysOptions = [2, 3, 4, 5, 6];

  // Goals disponibles (sin emojis, usamos SVG en el template)
  goals: { key: Goal; label: string }[] = [
    { key: 'FUERZA', label: 'Fuerza' },
    { key: 'HIPERTROFIA', label: 'Hipertrofia' },
    { key: 'RESISTENCIA', label: 'Resistencia' },
  ];

  ngOnInit(): void {
    // Debounce para la búsqueda (espera 300ms después de que el usuario deje de escribir)
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.page = 0;
        this.load();
      });

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
        search: this.searchQuery || undefined,
        daysPerWeek: this.daysFilter ?? undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p: CardsPage) => {
          this.cardsList = p.content;
          this.applyLocalFilter();
          this.totalPages = p.totalPages;
          this._cdr.markForCheck();
        },
        error: () => {
          this.errorMsg = 'Error al cargar rutinas';
          this._cdr.markForCheck();
        },
        complete: () => {
          this.loading = false;
          this._cdr.markForCheck();
        },
      });
  }

  // Filtro local adicional (por si el backend no soporta búsqueda)
  applyLocalFilter(): void {
    if (!this.searchQuery) {
      this.filteredCards = this.cardsList;
      return;
    }
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCards = this.cardsList.filter(card =>
      card.name.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query)
    );
  }

  // ----- UI events -----
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject$.next('');
  }

  onSelectGoal(goal: Goal | null): void {
    this.goalFilter = goal;
    this.page = 0;
    this.load();
  }

  onSelectDays(days: number | null): void {
    this.daysFilter = days;
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

  // Formatear número de usos (1000 -> 1K, etc.)
  formatUsageCount(count: number | undefined): string {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
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

  // Obtener icono del objetivo (ya no usamos emojis)
  getGoalIcon(goal: Goal): string {
    return '';
  }

  // Generar array de números de página para la paginación
  getPageNumbers(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];
    
    let start = Math.max(0, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);
    
    // Ajustar si estamos cerca del final
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
