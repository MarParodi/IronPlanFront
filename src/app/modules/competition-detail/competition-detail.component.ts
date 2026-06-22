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

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [CommonModule],
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

      <!-- MI POSICIÓN -->
      <div
        *ngIf="myScore"
        class="rounded-xl border border-ip-border
               bg-ip-surface overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">
          <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
            Mi posición
          </p>
        </div>

        <!-- GROUP -->
        <div
          *ngIf="!myScore.isMemberCompetition"
          class="grid grid-cols-3 gap-3 p-5">

          <div class="rounded-xl border border-ip-border bg-ip-surface p-4">

            <p class="text-xs text-ip-primary0 mb-2">
              Posición grupal
            </p>

            <h3 class="text-3xl font-bold text-cyan-400">
              #{{ myScore.groupRank }}
            </h3>
          </div>

          <div class="rounded-xl border border-ip-border bg-ip-surface p-4">

            <p class="text-xs text-ip-primary0 mb-2">
              Score grupo
            </p>

            <h3 class="text-3xl font-bold text-ip-primary">
              {{ myScore.groupScore | number:'1.0-0' }}
            </h3>
          </div>

          <div class="rounded-xl border border-ip-border bg-ip-surface p-4">

            <p class="text-xs text-ip-primary0 mb-2">
              Ranking interno
            </p>

            <h3 class="text-3xl font-bold text-violet-400">
              #{{ myScore.internalRank }}
            </h3>
          </div>
        </div>

        <!-- INDIVIDUAL -->
        <div
          *ngIf="myScore.isMemberCompetition"
          class="grid grid-cols-2 gap-3 p-5">

          <div class="rounded-xl border border-ip-border bg-ip-surface p-4">

            <p class="text-xs text-ip-primary0 mb-2">
              Mi posición
            </p>

            <h3 class="text-3xl font-bold text-cyan-400">
              #{{ myScore.memberRank }}
            </h3>
          </div>

          <div class="rounded-xl border border-ip-border bg-ip-surface p-4">

            <p class="text-xs text-ip-primary0 mb-2">
              Mi score
            </p>

            <h3 class="text-3xl font-bold text-ip-primary">
              {{ myScore.individualScore | number:'1.0-0' }}
            </h3>
          </div>
        </div>

        <!-- GROUP NAME -->
        <div *ngIf="myScore.groupName" class="px-5 pb-5">

          <div class="flex items-center gap-2 rounded-lg
                      border border-cyan-500/10
                      bg-cyan-500/5
                      px-3 py-2">

            <div class="w-2 h-2 rounded-full bg-cyan-400"></div>

            <span class="text-sm text-cyan-300">
              {{ myScore.groupName }}
            </span>
          </div>
        </div>
      </div>

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

            <h2
              class="mt-2 text-5xl font-bold"

              [ngClass]="{
                'text-cyan-400':
                  leaderboard[0].groupScore >= leaderboard[1].groupScore,

                'text-ip-muted':
                  leaderboard[0].groupScore < leaderboard[1].groupScore
              }">

              {{ leaderboard[0].groupScore | number:'1.0-0' }}
            </h2>
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

            <h2
              class="mt-2 text-5xl font-bold"

              [ngClass]="{
                'text-orange-400':
                  leaderboard[1].groupScore >= leaderboard[0].groupScore,

                'text-ip-muted':
                  leaderboard[1].groupScore < leaderboard[0].groupScore
              }">

              {{ leaderboard[1].groupScore | number:'1.0-0' }}
            </h2>
          </div>
        </div>
      </div>

      <!-- Ranking de miembros con filtro por nivel -->
      <div
        *ngIf="myScore?.isMemberCompetition"
        class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">
          <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
            Ranking de miembros
          </p>
          <p class="text-[11px] text-ip-primary0 mt-1">
            Competencia individual{{ competition?.participantMode === 'ORGANIZATION_MEMBERS' ? ' org-wide' : '' }}.
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              *ngFor="let tab of memberLevelTabs"
              (click)="setMemberLevelFilter(tab.value)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
              [ngClass]="memberLevelFilter === tab.value
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-ip-surface text-ip-muted border-ip-border hover:text-ip-primary'">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div *ngIf="loadingMemberLeaderboard" class="px-5 py-8 text-center text-sm text-ip-muted">
          Cargando ranking...
        </div>

        <div *ngIf="!loadingMemberLeaderboard && memberLeaderboard.length === 0" class="px-5 py-8 text-center text-sm text-ip-muted">
          Sin datos para este filtro.
        </div>

        <div *ngIf="!loadingMemberLeaderboard && memberLeaderboard.length > 0" class="divide-y divide-slate-900">
          <div
            *ngFor="let entry of memberLeaderboard"
            class="grid grid-cols-[70px_1fr_100px_80px] items-center px-5 py-3"
            [ngClass]="{ 'bg-cyan-500/5': isCurrentUser(entry.userId) }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              [ngClass]="{
                'bg-yellow-500/10 text-yellow-400': entry.rank === 1,
                'bg-slate-800 text-ip-muted': entry.rank !== 1
              }">
              {{ entry.rank }}
            </div>
            <p class="text-sm text-ip-primary truncate">
              {{ entry.fullName }}
              <span *ngIf="isCurrentUser(entry.userId)" class="text-cyan-500/70 text-xs ml-1">(tú)</span>
            </p>
            <span class="text-xs text-ip-muted capitalize">{{ getLevelLabel(entry.level) }}</span>
            <span class="text-right text-sm font-semibold text-ip-secondary">
              {{ entry.score | number:'1.0-0' }}
            </span>
          </div>
        </div>
      </div>

      <!-- LEADERBOARD grupal -->
      <div
        *ngIf="competition?.competitionType !== 'VERSUS'
               && !myScore?.isMemberCompetition
               && leaderboard.length > 0"

        class="rounded-xl border border-ip-border
               bg-ip-surface overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">

          <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
            Ranking por equipos
          </p>
          <p class="text-[11px] text-ip-primary0 mt-1">
            Puntuación total de cada grupo (suma de actividad de sus miembros).
          </p>
        </div>

        <div class="divide-y divide-slate-900">

          <div
            *ngFor="let entry of leaderboard"
            class="grid grid-cols-[70px_1fr_120px]
                   items-center px-5 py-3 transition-colors"

            [ngClass]="{
              'bg-cyan-500/5': isMyGroup(entry.groupId)
            }">

            <!-- RANK -->
            <div class="flex items-center">

              <div
                class="w-8 h-8 rounded-lg
                       flex items-center justify-center
                       text-xs font-bold"

                [ngClass]="{
                  'bg-yellow-500/10 text-yellow-400': entry.rank === 1,
                  'bg-slate-800 text-ip-muted': entry.rank !== 1
                }">

                {{ entry.rank }}
              </div>
            </div>

            <!-- USER -->
            <div class="flex items-center gap-3 min-w-0">

              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center
                       text-xs font-bold"

                [ngClass]="{
                  'bg-cyan-500/10 text-cyan-400':
                    isMyGroup(entry.groupId),

                  'bg-ip-surface text-ip-primary0':
                    !isMyGroup(entry.groupId)
                }">

                {{ getInitials(entry.groupName) }}
              </div>

              <div class="min-w-0">

                <p
                  class="text-sm truncate"

                  [ngClass]="{
                    'text-cyan-300': isMyGroup(entry.groupId),
                    'text-ip-primary': !isMyGroup(entry.groupId)
                  }">

                  {{ entry.groupName }}

                  <span
                    *ngIf="isMyGroup(entry.groupId)"
                    class="text-cyan-500/70 text-xs ml-1">

                    (tú)
                  </span>
                </p>
              </div>
            </div>

            <!-- SCORE -->
            <div class="text-right">

              <span
                class="text-sm font-semibold"

                [ngClass]="{
                  'text-cyan-400': entry.rank === 1,
                  'text-ip-secondary': entry.rank !== 1
                }">

                {{ entry.groupScore | number:'1.0-0' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ranking interno de tu equipo -->
      <div
        *ngIf="!myScore?.isMemberCompetition && internalRanking.length > 0"
        class="rounded-xl border border-violet-500/20 bg-ip-surface overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">
          <p class="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Ranking interno de tu equipo
            <span *ngIf="myScore?.groupName" class="text-ip-primary0 font-normal normal-case">
              — {{ myScore.groupName }}
            </span>
          </p>
          <p class="text-[11px] text-ip-primary0 mt-1">
            Solo miembros de tu equipo ven este ranking.
          </p>
        </div>

        <div class="divide-y divide-slate-900">
          <div
            *ngFor="let entry of internalRanking"
            class="grid grid-cols-[70px_1fr_120px] items-center px-5 py-3"
            [ngClass]="{ 'bg-violet-500/5': isCurrentUser(entry.userId) }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-800 text-ip-muted">
              {{ entry.position }}
            </div>
            <p class="text-sm text-ip-primary truncate">
              {{ entry.fullName }}
              <span *ngIf="isCurrentUser(entry.userId)" class="text-violet-400/80 text-xs ml-1">(tú)</span>
            </p>
            <span class="text-right text-sm font-semibold text-ip-secondary">
              {{ entry.score | number:'1.0-0' }}
            </span>
          </div>
        </div>
      </div>

      <!-- EMPTY -->
      <div
        *ngIf="leaderboard.length === 0 && memberLeaderboard.length === 0"
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
          Los scores se actualizan diariamente
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
  currentUserId: number | null = null;

  competition: any = null;
  myScore: any = null;
  leaderboard: any[] = [];
  memberLeaderboard: any[] = [];
  internalRanking: any[] = [];
  loading = true;
  loadingMemberLeaderboard = false;
  memberLevelFilter: string | null = null;
  memberLevelTabs = [
    { label: 'Todos', value: null as string | null },
    { label: 'Novato', value: 'NOVATO' },
    { label: 'Intermedio', value: 'INTERMEDIO' },
    { label: 'Avanzado', value: 'AVANZADO' },
  ];
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
        this.currentUserId = me?.id ?? null;
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

        this.competition = data.competition;
        this.myScore = data.myScore;
        this.leaderboard = data.groupLeaderboard ?? [];
        this.memberLeaderboard = data.memberLeaderboard ?? [];
        this.internalRanking = data.internalRanking ?? [];

        this.loading = false;
        this.cdr.markForCheck();

        if (this.myScore?.isMemberCompetition) {
          this.loadMemberLeaderboard();
        }
      },

      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setMemberLevelFilter(level: string | null): void {
    this.memberLevelFilter = level;
    this.loadMemberLeaderboard();
  }

  loadMemberLeaderboard(): void {
    if (!this.competitionId) return;

    this.loadingMemberLeaderboard = true;
    this.homeService
      .getMemberLeaderboard(this.competitionId, this.memberLevelFilter ?? undefined)
      .subscribe({
        next: (entries) => {
          this.memberLeaderboard = entries ?? [];
          this.loadingMemberLeaderboard = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingMemberLeaderboard = false;
          this.cdr.markForCheck();
        },
      });
  }

  getLevelLabel(level?: string): string {
    const labels: Record<string, string> = {
      NOVATO: 'Novato',
      INTERMEDIO: 'Intermedio',
      AVANZADO: 'Avanzado',
    };
    return level ? labels[level] ?? level : '—';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  isMyGroup(groupId: number): boolean {
    const participantId = this.myScore?.participantGroupId;
    if (participantId) return groupId === participantId;
    if (this.myGroupId && groupId === this.myGroupId) return true;
    return this.ancestorGroupIds.includes(groupId);
  }

  isCurrentUser(userId: number): boolean {
    return this.currentUserId != null && userId === this.currentUserId;
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
    };

    return labels[metric] ?? metric;
  }
}