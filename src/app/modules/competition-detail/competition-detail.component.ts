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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="min-h-screen bg-[#05070a] text-slate-100">
  <div class="max-w-5xl mx-auto px-6 py-8 space-y-5">

    <!-- HEADER -->
    <div class="flex items-center gap-4">

      <button
        (click)="goBack()"
        class="w-10 h-10 flex items-center justify-center
               rounded-xl border border-slate-900
               bg-[#0b0f13] hover:bg-[#11161c]
               transition-all duration-200">

        <svg xmlns="http://www.w3.org/2000/svg"
             class="w-4 h-4 text-slate-400"
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

        <p class="text-sm text-slate-500 mt-1">
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

      <p class="text-sm text-slate-500">
        Cargando competencia...
      </p>
    </div>

    <ng-container *ngIf="!loading">

      <!-- MI POSICIÓN -->
      <div
        *ngIf="myScore"
        class="rounded-xl border border-slate-900
               bg-[#0b0f13] overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Mi posición
          </p>
        </div>

        <!-- GROUP -->
        <div
          *ngIf="!myScore.memberCompetition"
          class="grid grid-cols-3 gap-3 p-5">

          <div class="rounded-xl border border-slate-900 bg-[#0f1419] p-4">

            <p class="text-xs text-slate-500 mb-2">
              Posición grupal
            </p>

            <h3 class="text-3xl font-bold text-cyan-400">
              #{{ myScore.groupRank }}
            </h3>
          </div>

          <div class="rounded-xl border border-slate-900 bg-[#0f1419] p-4">

            <p class="text-xs text-slate-500 mb-2">
              Score grupo
            </p>

            <h3 class="text-3xl font-bold text-white">
              {{ myScore.groupScore | number:'1.0-0' }}
            </h3>
          </div>

          <div class="rounded-xl border border-slate-900 bg-[#0f1419] p-4">

            <p class="text-xs text-slate-500 mb-2">
              Ranking interno
            </p>

            <h3 class="text-3xl font-bold text-violet-400">
              #{{ myScore.internalRank }}
            </h3>
          </div>
        </div>

        <!-- INDIVIDUAL -->
        <div
          *ngIf="myScore.memberCompetition"
          class="grid grid-cols-2 gap-3 p-5">

          <div class="rounded-xl border border-slate-900 bg-[#0f1419] p-4">

            <p class="text-xs text-slate-500 mb-2">
              Mi posición
            </p>

            <h3 class="text-3xl font-bold text-cyan-400">
              #{{ myScore.memberRank }}
            </h3>
          </div>

          <div class="rounded-xl border border-slate-900 bg-[#0f1419] p-4">

            <p class="text-xs text-slate-500 mb-2">
              Mi score
            </p>

            <h3 class="text-3xl font-bold text-white">
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
        class="rounded-xl border border-slate-900 bg-[#0b0f13] overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">

          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
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

            <p class="mt-4 text-sm font-medium text-slate-200">
              {{ leaderboard[0].groupName }}
            </p>

            <h2
              class="mt-2 text-5xl font-bold"

              [ngClass]="{
                'text-cyan-400':
                  leaderboard[0].groupScore >= leaderboard[1].groupScore,

                'text-slate-600':
                  leaderboard[0].groupScore < leaderboard[1].groupScore
              }">

              {{ leaderboard[0].groupScore | number:'1.0-0' }}
            </h2>
          </div>

          <!-- VS -->
          <div class="flex justify-center">

            <div class="w-16 h-16 rounded-full
                        border border-slate-800
                        bg-[#0f1419]
                        flex items-center justify-center">

              <span class="text-sm font-black tracking-widest text-slate-600">
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

            <p class="mt-4 text-sm font-medium text-slate-200">
              {{ leaderboard[1].groupName }}
            </p>

            <h2
              class="mt-2 text-5xl font-bold"

              [ngClass]="{
                'text-orange-400':
                  leaderboard[1].groupScore >= leaderboard[0].groupScore,

                'text-slate-600':
                  leaderboard[1].groupScore < leaderboard[0].groupScore
              }">

              {{ leaderboard[1].groupScore | number:'1.0-0' }}
            </h2>
          </div>
        </div>
      </div>

      <!-- LEADERBOARD -->
      <div
        *ngIf="competition?.competitionType !== 'VERSUS'
               && !myScore?.memberCompetition
               && leaderboard.length > 0"

        class="rounded-xl border border-slate-900
               bg-[#0b0f13] overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-900">

          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Tabla de posiciones
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
                  'bg-slate-800 text-slate-400': entry.rank !== 1
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

                  'bg-[#11161c] text-slate-500':
                    !isMyGroup(entry.groupId)
                }">

                {{ getInitials(entry.groupName) }}
              </div>

              <div class="min-w-0">

                <p
                  class="text-sm truncate"

                  [ngClass]="{
                    'text-cyan-300': isMyGroup(entry.groupId),
                    'text-slate-200': !isMyGroup(entry.groupId)
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
                  'text-slate-300': entry.rank !== 1
                }">

                {{ entry.groupScore | number:'1.0-0' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- EMPTY -->
      <div
        *ngIf="leaderboard.length === 0 && memberLeaderboard.length === 0"
        class="h-[300px] flex flex-col items-center justify-center text-center">

        <div class="w-16 h-16 rounded-2xl
                    border border-slate-900
                    bg-[#0b0f13]
                    flex items-center justify-center">

          <svg class="w-7 h-7 text-slate-700"
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

        <p class="mt-5 text-slate-400 font-medium">
          Sin datos aún
        </p>

        <p class="mt-1 text-sm text-slate-600">
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

  competition: any = null;
  myScore: any = null;
  leaderboard: any[] = [];
  memberLeaderboard: any[] = [];
  internalRanking: any[] = [];
  loading = true;
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

    forkJoin({
      competition: this.homeService.getCompetitionById(id),
      myScore: this.homeService.getMyScore(id),
      leaderboard: this.homeService.getLeaderboard(id),
    }).subscribe({

      next: ({ competition, myScore, leaderboard }) => {

        this.competition = competition;
        this.myScore = myScore;

        if (myScore?.memberCompetition) {

          this.homeService.getMemberLeaderboard(id).subscribe({
            next: (ml) => {
              this.memberLeaderboard = ml;
              this.cdr.markForCheck();
            }
          });

        } else {

          this.leaderboard = leaderboard;

          if (this.myGroupId) {

            this.homeService.getInternalRanking(id).subscribe({
              next: (ir) => {
                this.internalRanking = ir;
                this.cdr.markForCheck();
              }
            });
          }
        }

        this.loading = false;
        this.cdr.markForCheck();
      },

      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  isMyGroup(groupId: number): boolean {

    if (!this.myGroupId) {
      return false;
    }

    return groupId === this.myGroupId;
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
      WORKOUTS_COUNT: 'Entrenamientos'
    };

    return labels[metric] ?? metric;
  }
}