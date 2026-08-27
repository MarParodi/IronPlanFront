import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeService } from '../home/services/home.services';
import { inferMemberCompetitionFromDetail } from '../../core/utils/competition.util';
import { ordinalPosition } from '../../core/utils/reto-participant.util';
import { MiAporteCardComponent } from '../../shared/reto/mi-aporte-card.component';
import { MiEquipoCardComponent } from '../../shared/reto/mi-equipo-card.component';
import { LeaderboardSimpleComponent } from '../../shared/reto/leaderboard-simple.component';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule,
    MiAporteCardComponent,
    MiEquipoCardComponent,
    LeaderboardSimpleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="min-h-screen bg-ip-page text-ip-primary">
  <div class="max-w-5xl mx-auto px-6 py-8 space-y-5">

    <!-- HEADER -->
    <div class="flex items-center gap-4">

      <button
        (click)="goBack()"
        class="w-10 h-10 flex items-center justify-center
               rounded-xl border border-ip-border
               bg-ip-surface hover:bg-ip-surface
               transition-all duration-200">

        <svg xmlns="http://www.w3.org/2000/svg"
             class="w-4 h-4 text-ip-muted"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor"
             stroke-width="2">

          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight text-white truncate">
          {{ competition?.name ?? 'Competencia' }}
        </h1>

        <p class="text-sm text-ip-primary0 mt-1">
          {{ getTypeLabel(competition?.competitionType) }}
          ·
          {{ getMetricLabel(competition?.metricType) }}

          <span *ngIf="competition?.endDate">
            · hasta {{ competition?.endDate | date:'dd/MM/yy' }}
          </span>

          <span *ngIf="!competition?.endDate">
            · permanente
          </span>
        </p>
      </div>

      <span
        class="ml-auto text-[11px] font-semibold px-3 py-1 rounded-lg border"

        [ngClass]="{
          'bg-cyan-500/10 text-cyan-400 border-cyan-500/10':
            competition?.competitionType === 'RANKING',

          'bg-violet-500/10 text-violet-400 border-violet-500/10':
            competition?.competitionType === 'CHALLENGE',

          'bg-orange-500/10 text-orange-400 border-orange-500/10':
            competition?.competitionType === 'VERSUS'
        }">

        {{ getTypeLabel(competition?.competitionType) }}
      </span>
    </div>

    <!-- LOADING -->
    <div
      *ngIf="loading"
      class="h-[400px] flex flex-col items-center justify-center gap-4">

      <div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>

      <p class="text-sm text-ip-primary0">
        Cargando competencia...
      </p>
    </div>

    <ng-container *ngIf="!loading">

      <!-- MI APORTE Y MI EQUIPO -->
      <div *ngIf="myScore" class="grid gap-4 md:grid-cols-2">

        <app-mi-aporte-card
          [myScore]="myScore"
          [metricLabel]="getMetricLabel(competition?.metricType)"
          [isMemberCompetition]="myScore.isMemberCompetition">
        </app-mi-aporte-card>

        <app-mi-equipo-card
          [myScore]="myScore"
          [groupLeaderboard]="leaderboard"
          [isMemberCompetition]="myScore.isMemberCompetition">
        </app-mi-equipo-card>
      </div>

      <!-- Ganadores declarados (retos finalizados) -->
      <div
        *ngIf="myScore?.isMemberCompetition && competition?.status === 'FINISHED' && declaredWinners.length"
        class="space-y-2">
        <div
          *ngFor="let w of declaredWinners"
          class="rounded-xl bg-amber-500/10 border border-amber-500/30 px-5 py-4 flex items-center gap-3">
          <span class="text-2xl">🏆</span>
          <div>
            <p class="text-xs uppercase tracking-wide text-amber-400 font-semibold">
              Ganador — {{ w.levelLabel }}
            </p>
            <p class="text-lg font-semibold text-ip-primary">{{ w.fullName }}</p>
          </div>
        </div>
      </div>

      <!-- Podios compuestos (solo lectura) -->
      <section
        *ngIf="podiums && myScore?.isMemberCompetition && competition?.status === 'FINISHED'"
        class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden space-y-4 p-5">
        <h3 class="text-sm font-semibold text-ip-secondary">Podios</h3>

        <div *ngIf="podiums.generalTop3?.length">
          <p class="text-xs font-semibold text-ip-muted mb-2">General</p>
          <div class="space-y-2">
            <div
              *ngFor="let e of podiums.generalTop3"
              class="flex items-center gap-3 px-3 py-2 rounded-lg bg-ip-page/50">
              <span>{{ e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉' }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">{{ e.fullName }}</p>
              </div>
            </div>
          </div>
        </div>

        <div *ngFor="let level of levelKeys">
          <ng-container *ngIf="podiums.byLevel[level]?.length">
            <p class="text-xs font-semibold text-ip-muted mb-2">{{ levelLabels[level] }}</p>
            <div class="space-y-2">
              <div
                *ngFor="let e of podiums.byLevel[level]"
                class="flex items-center gap-3 px-3 py-2 rounded-lg bg-ip-page/50">
                <span>{{ e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm">{{ e.fullName }}</p>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </section>

      <!-- VERSUS -->
      <div
        *ngIf="competition?.competitionType === 'VERSUS' && leaderboard.length === 2"
        class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">

          <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
            Enfrentamiento
          </p>
        </div>

        <div class="grid grid-cols-[1fr_100px_1fr] items-center p-8">

          <!-- TEAM A -->
          <div class="flex flex-col items-center">

            <div class="w-16 h-16 rounded-2xl
                        border border-cyan-500/10
                        bg-cyan-500/10
                        flex items-center justify-center
                        text-cyan-400 font-bold text-lg">

              {{ getInitials(leaderboard[0].groupName) }}
            </div>

            <p class="mt-4 text-sm font-medium text-ip-primary">
              {{ leaderboard[0].groupName }}
            </p>

            <p
              class="mt-2 text-sm font-semibold uppercase tracking-wide"

              [ngClass]="{
                'text-cyan-400': leaderboard[0].rank === 1,
                'text-ip-muted': leaderboard[0].rank !== 1
              }">

              {{ getOrdinal(leaderboard[0].rank) }}
            </p>
          </div>

          <!-- VS -->
          <div class="flex justify-center">

            <div class="w-16 h-16 rounded-full
                        border border-ip-border
                        bg-ip-surface
                        flex items-center justify-center">

              <span class="text-sm font-black tracking-widest text-ip-muted">
                VS
              </span>
            </div>
          </div>

          <!-- TEAM B -->
          <div class="flex flex-col items-center">

            <div class="w-16 h-16 rounded-2xl
                        border border-orange-500/10
                        bg-orange-500/10
                        flex items-center justify-center
                        text-orange-400 font-bold text-lg">

              {{ getInitials(leaderboard[1].groupName) }}
            </div>

            <p class="mt-4 text-sm font-medium text-ip-primary">
              {{ leaderboard[1].groupName }}
            </p>

            <p
              class="mt-2 text-sm font-semibold uppercase tracking-wide"

              [ngClass]="{
                'text-orange-400': leaderboard[1].rank === 1,
                'text-ip-muted': leaderboard[1].rank !== 1
              }">

              {{ getOrdinal(leaderboard[1].rank) }}
            </p>
          </div>
        </div>
      </div>

      <!-- POSICIONES POR EQUIPO (sin puntajes) -->
      <app-leaderboard-simple
        *ngIf="competition?.competitionType !== 'VERSUS' && !myScore?.isMemberCompetition"
        [entries]="leaderboard"
        [myParticipantGroupId]="myParticipantGroupId"
        title="Posiciones del reto">
      </app-leaderboard-simple>

      <!-- EMPTY -->
      <div
        *ngIf="leaderboard.length === 0 && !myScore"
        class="h-[300px] flex flex-col items-center justify-center text-center">

        <div class="w-16 h-16 rounded-2xl
                    border border-ip-border
                    bg-ip-surface
                    flex items-center justify-center">

          <svg class="w-7 h-7 text-ip-secondary"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
               stroke-width="1.5">

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>

        <p class="mt-5 text-ip-muted font-medium">
          Sin datos aún
        </p>

        <p class="mt-1 text-sm text-ip-muted">
          Registra una actividad para empezar a aportar
        </p>
      </div>

    </ng-container>
  </div>
</div>
`
})
export class CompetitionDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private homeService = inject(HomeService);
  private cdr = inject(ChangeDetectorRef);
  ancestorGroupIds: number[] = [];

  competition: any = null;
  myScore: any = null;
  leaderboard: any[] = [];
  loading = true;
  myParticipantGroupId: number | null = null;
  podiums: any = null;
  declaredWinners: any[] = [];
  levelKeys = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
  levelLabels: Record<string, string> = {
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZADO: 'Avanzado',
  };
  private competitionId = 0;
  myGroupId: number | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.homeService.getMe().subscribe({
      next: (me: any) => {
        this.myGroupId = me?.organizationalGroupId ?? null;
        this.ancestorGroupIds = me?.ancestorGroupIds ?? [];
        this.loadCompetition(Number(id));
      },

      error: () => this.loadCompetition(Number(id))
    });
  }

  loadCompetition(id: number): void {
    this.loading = true;
    this.competitionId = id;

    this.homeService.getCompetitionDetail(id).subscribe({
      next: (data) => {
        const isMember = inferMemberCompetitionFromDetail(data);

        this.competition = data?.competition ?? data;
        this.myScore = data?.myScore ?? null;
        this.leaderboard = data?.groupLeaderboard ?? [];

        if (this.competition) this.competition.isMemberCompetition = isMember;
        if (this.myScore) this.myScore.isMemberCompetition = isMember;

        this.myParticipantGroupId = this.resolveMyParticipantGroupId();

        this.loading = false;
        this.cdr.markForCheck();

        if (isMember && this.competition?.status === 'FINISHED') {
          this.loadRetoResults();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadRetoResults(): void {
    if (!this.competitionId) return;

    this.homeService.getCompetitionWinners(this.competitionId).subscribe({
      next: (w) => {
        this.declaredWinners = w || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.declaredWinners = [];
        this.cdr.markForCheck();
      },
    });

    this.homeService.getCompetitionPodiums(this.competitionId).subscribe({
      next: (p) => {
        this.podiums = p?.generalTop3?.length || p?.byLevel ? p : null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.podiums = null;
        this.cdr.markForCheck();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getOrdinal(rank?: number): string {
    return ordinalPosition(rank);
  }

  /** El equipo propio puede ser el grupo directo o un ancestro presente en el reto. */
  private resolveMyParticipantGroupId(): number | null {
    const participantId = this.myScore?.participantGroupId;
    if (participantId) return participantId;

    const ids = this.leaderboard.map((e) => e.groupId);
    if (this.myGroupId && ids.includes(this.myGroupId)) return this.myGroupId;

    return this.ancestorGroupIds.find((id) => ids.includes(id)) ?? null;
  }

  getInitials(name: string): string {

    if (!name) {
      return '?';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getTypeLabel(type: string): string {

    const labels: Record<string, string> = {
      RANKING: 'Ranking',
      CHALLENGE: 'Challenge',
      VERSUS: 'Versus'
    };

    return labels[type] ?? type;
  }

  getMetricLabel(metric: string): string {

    const labels: Record<string, string> = {
      SESSIONS: 'Sesiones',
      ACTIVE_MINUTES: 'Min. activos',
      WORKOUTS_COUNT: 'Entrenamientos',
      VOLUME_TOTAL: 'Volumen (kg)',
      FREE_ACTIVITY_COUNT: 'Actividades libres',
      FREE_ACTIVITY_KM: 'Km cardio',
      TEAM_POINTS: 'Puntos',
    };

    return labels[metric] ?? metric;
  }
}