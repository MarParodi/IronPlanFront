import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  GruposService,
  CompetitionDetailView,
  DeclaredWinnerDto,
  PodiumsResponse,
} from './services/grupos.service';
import { UserService } from '../user/services/user.service';
import { inferMemberCompetitionFromDetail } from '../../core/utils/competition.util';

@Component({
  selector: 'app-grupo-reto-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="loading" class="text-sm text-ip-muted py-12 text-center">Cargando reto...</div>
    <p *ngIf="error" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</p>

    <div *ngIf="!loading && detail" class="space-y-6 max-w-4xl">
      <a [routerLink]="['/grupos', groupId, 'retos']"
        class="inline-flex items-center gap-1 text-sm text-ip-muted hover:text-teal-400 transition">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a retos
      </a>

      <header class="space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-bold text-ip-primary">{{ detail.competition.name }}</h2>
            <p class="text-sm text-ip-muted mt-1">
              {{ typeLabel(detail.competition.competitionType) }}
              · {{ scopeLabel(detail.competition.scopeLevel) }}
              · {{ detail.metricLabel || metricLabel(detail.competition.metricType) }}
              · {{ detail.competition.startDate | date:'dd/MM/yyyy' }}
              <span *ngIf="detail.competition.endDate"> – {{ detail.competition.endDate | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="!detail.competition.endDate"> · permanente</span>
            </p>
          </div>
          <span [class]="statusClass(detail.competition.status)">{{ statusLabel(detail.competition.status) }}</span>
        </div>

        <div *ngIf="declaredWinners.length"
          class="space-y-2">
          <div *ngFor="let w of declaredWinners"
            class="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center gap-3">
            <span class="text-2xl">🏆</span>
            <div>
              <p class="text-xs uppercase tracking-wide text-amber-400 font-semibold">Ganador — {{ w.levelLabel }}</p>
              <p class="text-lg font-semibold text-ip-primary">{{ w.fullName }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="!declaredWinners.length && detail.winner?.name"
          class="rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-3 flex flex-wrap items-center gap-3">
          <span class="text-2xl">🏆</span>
          <div>
            <p class="text-xs uppercase tracking-wide text-teal-400 font-semibold">
              {{ detail.competition.status === 'FINISHED' ? 'Ganador' : 'Líder actual' }}
            </p>
            <p class="text-lg font-semibold text-ip-primary">
              {{ detail.winner?.name }}
              <span *ngIf="detail.winner?.tie" class="text-sm text-ip-muted font-normal"> (empate)</span>
            </p>
            <p class="text-sm text-ip-muted">
              {{ detail.winner?.score | number:'1.0-1' }} {{ detail.metricLabel || metricLabel(detail.competition.metricType) }}
            </p>
          </div>
        </div>
        <p *ngIf="!declaredWinners.length && !detail.winner?.name" class="text-sm text-ip-primary0">
          Aún no hay puntuación registrada. Los puntos se actualizan al completar entrenamientos.
        </p>
      </header>

      <!-- Podios compuestos (solo lectura) -->
      <section *ngIf="podiums && detail.competition.isMemberCompetition && detail.competition.status === 'FINISHED'"
        class="rounded-2xl bg-ip-surface border border-ip-border overflow-hidden space-y-4 p-4">
        <h3 class="text-sm font-semibold text-ip-secondary">Podios (puntuación compuesta)</h3>

        <div *ngIf="podiums.generalTop3?.length">
          <p class="text-xs font-semibold text-ip-muted mb-2">General</p>
          <div class="space-y-2">
            <div *ngFor="let e of podiums.generalTop3" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-ip-page/50">
              <span>{{ e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉' }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">{{ e.fullName }}</p>
                <p class="text-xs text-ip-muted">Score {{ e.compositeScore | number:'1.1-1' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div *ngFor="let level of levelKeys">
          <ng-container *ngIf="podiums.byLevel[level]?.length">
            <p class="text-xs font-semibold text-ip-muted mb-2">{{ levelLabels[level] }}</p>
            <div class="space-y-2">
              <div *ngFor="let e of podiums.byLevel[level]" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-ip-page/50">
                <span>{{ e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm">{{ e.fullName }}</p>
                  <p class="text-xs text-ip-muted">Score {{ e.compositeScore | number:'1.1-1' }}</p>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </section>

      <div *ngIf="detail.myScore" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div *ngIf="!detail.myScore.isMemberCompetition && detail.myScore.groupRank"
          class="rounded-xl bg-ip-page border border-ip-border p-4">
          <p class="text-[10px] uppercase text-ip-primary0 font-semibold">Tu equipo</p>
          <p class="text-xl font-bold text-teal-400">#{{ detail.myScore.groupRank }}</p>
          <p class="text-xs text-ip-muted">{{ detail.myScore.groupScore | number:'1.0-1' }} pts</p>
          <p *ngIf="detail.myScore.groupName" class="text-[11px] text-ip-primary0 mt-1 truncate">{{ detail.myScore.groupName }}</p>
        </div>
        <div *ngIf="detail.myScore.isMemberCompetition && detail.myScore.memberRank"
          class="rounded-xl bg-ip-page border border-ip-border p-4">
          <p class="text-[10px] uppercase text-ip-primary0 font-semibold">Tu posición</p>
          <p class="text-xl font-bold text-teal-400">#{{ detail.myScore.memberRank }}</p>
          <p class="text-xs text-ip-muted">{{ detail.myScore.individualScore | number:'1.0-1' }} pts</p>
        </div>
        <div *ngIf="detail.myScore.internalRank && !detail.myScore.isMemberCompetition"
          class="rounded-xl bg-ip-page border border-ip-border p-4">
          <p class="text-[10px] uppercase text-ip-primary0 font-semibold">Dentro del equipo</p>
          <p class="text-xl font-bold text-ip-primary">#{{ detail.myScore.internalRank }}</p>
          <p class="text-xs text-ip-muted">{{ detail.myScore.individualScore | number:'1.0-1' }} pts</p>
        </div>
      </div>

      <!-- VERSUS: enfrentamiento directo entre 2 grupos -->
      <section *ngIf="isVersusGroup && detail.groupLeaderboard?.length === 2"
        class="rounded-2xl bg-ip-surface border border-ip-border overflow-hidden">
        <h3 class="text-sm font-semibold text-ip-secondary px-4 py-3 border-b border-ip-border">Enfrentamiento</h3>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-6" *ngIf="detail.groupLeaderboard as lb">
          <div class="text-center">
            <p class="font-semibold text-ip-primary">{{ lb[0].groupName }}</p>
            <p class="text-3xl font-bold mt-2 text-teal-400">{{ lb[0].groupScore | number:'1.0-0' }}</p>
            <p *ngIf="isMyParticipantGroup(lb[0].groupId)" class="text-xs text-teal-500/80 mt-1">Tu equipo</p>
          </div>
          <span class="text-sm font-black text-ip-muted tracking-widest">VS</span>
          <div class="text-center">
            <p class="font-semibold text-ip-primary">{{ lb[1].groupName }}</p>
            <p class="text-3xl font-bold mt-2 text-orange-400">{{ lb[1].groupScore | number:'1.0-0' }}</p>
            <p *ngIf="isMyParticipantGroup(lb[1].groupId)" class="text-xs text-teal-500/80 mt-1">Tu equipo</p>
          </div>
        </div>
      </section>

      <!-- Ranking grupal (RANKING / CHALLENGE entre grupos) -->
      <section *ngIf="detail.groupLeaderboard?.length && !isVersusGroup"
        class="rounded-2xl bg-ip-surface border border-ip-border overflow-hidden">
        <h3 class="text-sm font-semibold text-ip-secondary px-4 py-3 border-b border-ip-border">
          Ranking por equipos
        </h3>
        <p class="text-xs text-ip-primary0 px-4 py-2 border-b border-ip-border/50">
          Puntuación total de cada grupo (suma de la actividad de todos sus miembros).
        </p>
        <div class="divide-y divide-slate-800">
          <div *ngFor="let e of detail.groupLeaderboard"
            class="flex items-center gap-4 px-4 py-3"
            [class.leader-row]="e.rank === 1"
            [class.my-row]="isMyParticipantGroup(e.groupId)">
            <span class="w-8 text-center font-bold"
              [class.text-teal-400]="e.rank === 1"
              [class.text-ip-primary0]="e.rank !== 1">#{{ e.rank }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-ip-primary">
                {{ e.groupName }}
                <span *ngIf="isMyParticipantGroup(e.groupId)" class="text-teal-500/80 text-xs ml-1">(tu equipo)</span>
              </p>
              <p class="text-xs text-ip-primary0">{{ e.activeMembers }} miembros en el equipo</p>
            </div>
            <span class="font-semibold tabular-nums"
              [class.text-teal-400]="e.rank === 1"
              [class.text-ip-secondary]="e.rank !== 1">{{ e.groupScore | number:'1.0-1' }}</span>
          </div>
        </div>
      </section>

      <!-- Scope GRUPO: ranking interno del grupo (todos los miembros) -->
      <section *ngIf="detail.memberLeaderboard?.length"
        class="rounded-2xl bg-ip-surface border border-ip-border overflow-hidden">
        <h3 class="text-sm font-semibold text-ip-secondary px-4 py-3 border-b border-ip-border">
          Ranking interno del grupo
        </h3>
        <p class="text-xs text-ip-primary0 px-4 py-2 border-b border-ip-border/50">
          Competencia dentro del mismo grupo: cada miembro contribuye con su actividad individual.
        </p>
        <div class="divide-y divide-slate-800">
          <div *ngFor="let e of detail.memberLeaderboard"
            class="flex items-center gap-4 px-4 py-3"
            [class.leader-row]="e.rank === 1"
            [class.my-row]="isCurrentUser(e.userId)">
            <span class="w-8 text-center font-bold"
              [class.text-teal-400]="e.rank === 1"
              [class.text-ip-primary0]="e.rank !== 1">#{{ e.rank }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-ip-primary">
                {{ e.fullName }}
                <span *ngIf="isCurrentUser(e.userId)" class="text-teal-500/80 text-xs ml-1">(tú)</span>
              </p>
              <p class="text-xs text-ip-primary0">{{ e.username }}</p>
            </div>
            <span class="font-semibold tabular-nums"
              [class.text-teal-400]="e.rank === 1"
              [class.text-ip-secondary]="e.rank !== 1">{{ e.score | number:'1.0-1' }}</span>
          </div>
        </div>
      </section>

      <!-- Ranking interno de tu equipo (competencias entre grupos) -->
      <section *ngIf="detail.internalRanking?.length"
        class="rounded-2xl bg-ip-surface border border-violet-500/20 overflow-hidden">
        <h3 class="text-sm font-semibold text-violet-300 px-4 py-3 border-b border-ip-border">
          Ranking interno de tu equipo
          <span *ngIf="detail.myScore?.groupName" class="text-ip-muted font-normal"> — {{ detail.myScore?.groupName }}</span>
        </h3>
        <p class="text-xs text-ip-primary0 px-4 py-2 border-b border-ip-border/50">
          Solo ves el ranking de los miembros de tu propio equipo. Los demás grupos no pueden ver tu ranking interno.
        </p>
        <div class="divide-y divide-slate-800">
          <div *ngFor="let e of detail.internalRanking"
            class="flex items-center gap-4 px-4 py-3"
            [class.my-row]="isCurrentUser(e.userId)">
            <span class="w-8 text-center font-bold text-ip-primary0">#{{ e.position }}</span>
            <div class="flex-1">
              <p class="font-medium text-ip-primary">
                {{ e.fullName }}
                <span *ngIf="isCurrentUser(e.userId)" class="text-teal-500/80 text-xs ml-1">(tú)</span>
              </p>
            </div>
            <span class="text-ip-secondary tabular-nums">{{ e.score | number:'1.0-1' }}</span>
          </div>
        </div>
      </section>

      <p *ngIf="detail.lastCalculatedAt" class="text-[11px] text-ip-muted text-right">
        Última actualización: {{ detail.lastCalculatedAt | date:'dd/MM/yyyy HH:mm' }}
      </p>
    </div>
  `,
  styles: [`
    .leader-row { background: rgba(45, 212, 191, 0.05); }
    .my-row { background: rgba(45, 212, 191, 0.08); }
  `]
})
export class GrupoRetoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gruposService = inject(GruposService);
  private userService = inject(UserService);

  groupId = 0;
  competitionId = 0;
  detail?: CompetitionDetailView;
  podiums?: PodiumsResponse;
  declaredWinners: DeclaredWinnerDto[] = [];
  levelKeys = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
  levelLabels: Record<string, string> = {
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZADO: 'Avanzado',
  };
  loading = true;
  error = '';
  currentUserId: number | null = null;

  get isVersusGroup(): boolean {
    return this.detail?.competition?.competitionType === 'VERSUS'
      && !this.detail?.competition?.isMemberCompetition;
  }

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (me) => { this.currentUserId = me?.id ?? null; },
      error: () => {}
    });
    this.route.paramMap.subscribe(params => {
      this.competitionId = Number(params.get('competitionId'));
      const parentId = this.route.parent?.snapshot.paramMap.get('groupId');
      if (parentId) this.groupId = Number(parentId);
      this.load();
    });
  }

  load(): void {
    if (!this.groupId || !this.competitionId) return;
    this.loading = true;
    this.error = '';
    this.gruposService.getRetoDetail(this.groupId, this.competitionId).subscribe({
      next: (d) => {
        const isMember = inferMemberCompetitionFromDetail(d);
        if (d.competition) d.competition.isMemberCompetition = isMember;
        if (d.myScore) d.myScore.isMemberCompetition = isMember;
        this.detail = d;
        this.loading = false;
        if (isMember && d.competition.status === 'FINISHED') {
          this.gruposService.getRetoWinners(this.competitionId).subscribe({
            next: (w) => { this.declaredWinners = w || []; },
            error: () => { this.declaredWinners = []; },
          });
          this.gruposService.getRetoPodiums(this.competitionId).subscribe({
            next: (p) => { this.podiums = p?.generalTop3?.length || p?.byLevel ? p : undefined; },
            error: () => { this.podiums = undefined; },
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.error?.message || 'No se pudo cargar el reto';
      }
    });
  }

  isMyParticipantGroup(groupId: number): boolean {
    const pid = this.detail?.myScore?.participantGroupId;
    if (pid) return groupId === pid;
    return false;
  }

  isCurrentUser(userId: number): boolean {
    return this.currentUserId != null && userId === this.currentUserId;
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = { RANKING: 'Ranking continuo', CHALLENGE: 'Reto con fecha', VERSUS: 'Versus' };
    return m[t] ?? t;
  }

  scopeLabel(s: string): string {
    const m: Record<string, string> = {
      GRUPO: 'Interno del grupo',
      CARRERA: 'Carrera',
      FACULTAD: 'Facultad',
      EMPRESA: 'Organización'
    };
    return m[s] ?? s;
  }

  metricLabel(m: string): string {
    const labels: Record<string, string> = {
      SESSIONS: 'sesiones',
      ACTIVE_MINUTES: 'min. activos',
      WORKOUTS_COUNT: 'entrenamientos',
      VOLUME_TOTAL: 'kg volumen',
      FREE_ACTIVITY_COUNT: 'actividades libres',
      FREE_ACTIVITY_KM: 'km cardio',
    };
    return labels[m] ?? m;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activo', FINISHED: 'Finalizado', DRAFT: 'Borrador' };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const base = 'text-[11px] font-semibold uppercase px-2.5 py-1 rounded-md';
    if (s === 'ACTIVE') return `${base} bg-teal-500/15 text-teal-400 border border-teal-500/25`;
    if (s === 'FINISHED') return `${base} bg-slate-600/30 text-ip-secondary`;
    return `${base} bg-ip-surface/50 text-ip-muted`;
  }
}
