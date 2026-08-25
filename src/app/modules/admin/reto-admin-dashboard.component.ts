import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  AdminService,
  AdminRetoDashboard,
  AdminRetoKpis,
  AdminRetoTeam,
} from '../home/services/admin.service';

@Component({
  selector: 'app-reto-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-6xl">
      <a routerLink="/grupos/administrar" [queryParams]="{ seccion: 'competencias' }"
        class="inline-flex items-center gap-1 text-sm text-ip-muted hover:text-teal-400 transition">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a competencias
      </a>

      <div *ngIf="loading" class="h-64 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-ip-muted">Cargando dashboard del reto...</p>
      </div>

      <p *ngIf="error" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</p>

      <ng-container *ngIf="!loading && dashboard as d">
        <header class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div class="space-y-2 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
                [ngClass]="statusClass(d.competition.status)">{{ statusLabel(d.competition.status) }}</span>
              <span class="text-[11px] text-ip-muted">Vista administrativa · no participas en el reto</span>
            </div>
            <h2 class="text-2xl font-bold text-ip-primary truncate">{{ d.competition.name }}</h2>
            <p class="text-sm text-ip-muted">
              {{ d.competition.scopeReferenceName }}
              · {{ d.competition.startDate | date:'dd/MM/yyyy' }}
              <span *ngIf="d.competition.endDate"> – {{ d.competition.endDate | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="!d.competition.endDate"> · permanente</span>
              · semana {{ d.weekIndex + 1 }}
              ({{ d.weekStart | date:'dd/MM' }} – {{ d.weekEnd | date:'dd/MM' }})
            </p>
          </div>

          <label *ngIf="!d.competition.isMemberCompetition && d.teams.length > 1"
            class="flex flex-col gap-1 text-xs text-ip-muted">
            Filtrar por grupo
            <select [(ngModel)]="selectedGroupId" class="member-select min-w-[220px]">
              <option [ngValue]="null">Todos los equipos</option>
              <option *ngFor="let t of d.teams" [ngValue]="t.groupId">{{ t.groupName }}</option>
            </select>
          </label>
        </header>

        <!-- Estado actual -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold text-ip-secondary">Estado actual</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <article *ngFor="let team of displayedTeams"
              class="rounded-2xl border border-ip-border bg-ip-surface p-4 space-y-1"
              [class.ring-1]="team.rank === 1"
              [class.ring-teal-400]="team.rank === 1">
              <p class="text-xs uppercase tracking-wide text-ip-muted">{{ team.groupName }}</p>
              <p class="text-lg font-semibold text-ip-primary">{{ ordinal(team.rank) }}</p>
              <p class="text-3xl font-bold tabular-nums"
                [class.text-teal-400]="team.rank === 1"
                [class.text-ip-primary]="team.rank !== 1">{{ team.score | number:'1.0-1' }}</p>
              <p class="text-xs text-ip-muted">puntos</p>
            </article>

            <article *ngIf="d.gapFirstSecond != null"
              class="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-1">
              <p class="text-xs uppercase tracking-wide text-amber-300">Diferencia</p>
              <p class="text-3xl font-bold tabular-nums text-amber-300">{{ d.gapFirstSecond | number:'1.0-1' }}</p>
              <p class="text-xs text-ip-muted">puntos entre 1.º y 2.º</p>
            </article>
          </div>

          <p *ngIf="insight" class="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            {{ insight }}
          </p>
        </section>

        <!-- KPIs -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold text-ip-secondary">Esta semana</h3>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div class="metric-card">
              <p class="metric-label">Participantes activos</p>
              <p class="metric-value text-teal-400">{{ kpis.activeThisWeek }}</p>
            </div>
            <div class="metric-card">
              <p class="metric-label">Actividades registradas</p>
              <p class="metric-value">{{ kpis.totalActivities }}</p>
            </div>
            <div class="metric-card">
              <p class="metric-label">Puntos generados hoy</p>
              <p class="metric-value">{{ kpis.pointsToday | number:'1.0-1' }}</p>
            </div>
            <div class="metric-card">
              <p class="metric-label">Puntos de la semana</p>
              <p class="metric-value">{{ kpis.pointsThisWeek | number:'1.0-1' }}</p>
            </div>
            <div class="metric-card">
              <p class="metric-label">Promedio por integrante</p>
              <p class="metric-value">{{ kpis.avgPointsPerMember | number:'1.0-1' }}</p>
            </div>
            <div class="metric-card">
              <p class="metric-label">Integrantes que aportaron</p>
              <p class="metric-value text-teal-400">{{ kpis.contributionPercent | number:'1.0-0' }}%</p>
            </div>
          </div>
        </section>

        <!-- Participación -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold text-ip-secondary">Participación del equipo</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <article *ngFor="let team of displayedTeams"
              class="rounded-2xl border border-ip-border bg-ip-surface p-4 space-y-2">
              <div class="flex items-baseline justify-between gap-3">
                <p class="font-semibold text-ip-primary">{{ team.groupName }}</p>
                <p class="text-teal-400 font-semibold tabular-nums">{{ team.participationPercent | number:'1.0-0' }}%</p>
              </div>
              <p class="text-sm text-ip-muted">
                {{ team.activeThisWeek }} de {{ team.rosterSize }} participantes activos esta semana
              </p>
              <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div class="h-full bg-teal-500/80 rounded-full" [style.width.%]="bar(team.participationPercent)"></div>
              </div>
            </article>
          </div>
        </section>

        <!-- Distribución -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold text-ip-secondary">Distribución de puntos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <article *ngFor="let team of displayedTeams"
              class="rounded-2xl border border-ip-border bg-ip-surface p-4 space-y-3">
              <p class="font-semibold text-ip-primary">{{ team.groupName }}</p>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-ip-muted">Fuerza</span>
                  <span class="tabular-nums text-teal-300">{{ team.fuerzaPoints | number:'1.0-1' }} pts</span>
                </div>
                <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-teal-400/80 rounded-full" [style.width.%]="share(team.fuerzaPoints, team)"></div>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-ip-muted">Actividad libre</span>
                  <span class="tabular-nums text-violet-300">{{ team.librePoints | number:'1.0-1' }} pts</span>
                </div>
                <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-violet-400/80 rounded-full" [style.width.%]="share(team.librePoints, team)"></div>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-ip-muted">Bonos grupales</span>
                  <span class="tabular-nums text-amber-300">{{ team.teamBonusPoints | number:'1.0-1' }} pts</span>
                </div>
                <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-amber-400/80 rounded-full" [style.width.%]="share(team.teamBonusPoints, team)"></div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Aportes individuales -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold text-ip-secondary">Aportes individuales</h3>
          <p class="text-xs text-ip-muted">Solo visible para administradores. Los participantes no ven esta tabla.</p>

          <div *ngFor="let team of displayedTeams" class="rounded-2xl border border-ip-border bg-ip-surface overflow-hidden">
            <div class="px-4 py-3 border-b border-ip-border flex items-center justify-between">
              <p class="font-semibold text-ip-primary">{{ team.groupName }}</p>
              <p class="text-xs text-ip-muted">{{ team.rosterSize }} integrantes</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-ip-page text-ip-primary0 text-xs uppercase">
                  <tr>
                    <th class="px-4 py-3">Participante</th>
                    <th class="px-4 py-3 text-right">Puntos</th>
                    <th class="px-4 py-3 text-right">Fuerza</th>
                    <th class="px-4 py-3 text-right">Actividad libre</th>
                    <th class="px-4 py-3 text-right">Días activos</th>
                    <th class="px-4 py-3">Última actividad</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  <tr *ngFor="let m of team.members" class="hover:bg-slate-800/30">
                    <td class="px-4 py-3 text-ip-primary font-medium">{{ m.fullName }}</td>
                    <td class="px-4 py-3 text-right tabular-nums text-teal-300">{{ m.points | number:'1.0-1' }}</td>
                    <td class="px-4 py-3 text-right tabular-nums">{{ m.fuerza | number:'1.0-1' }}</td>
                    <td class="px-4 py-3 text-right tabular-nums">{{ m.libre | number:'1.0-1' }}</td>
                    <td class="px-4 py-3 text-right tabular-nums">{{ m.activeDays }}</td>
                    <td class="px-4 py-3 text-ip-muted">{{ lastActivityLabel(m.lastActivityAt) }}</td>
                  </tr>
                  <tr *ngIf="!team.members.length">
                    <td colspan="6" class="px-4 py-6 text-center text-ip-muted">Sin integrantes en este equipo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .member-select {
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.55rem 0.75rem;
      font-size: 0.875rem;
    }
    .metric-card {
      border-radius: 1rem;
      border: 1px solid #1e293b;
      background: #0f172a;
      padding: 1rem;
    }
    .metric-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
      margin-bottom: 0.4rem;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f8fafc;
    }
  `]
})
export class RetoAdminDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);

  loading = true;
  error = '';
  dashboard: AdminRetoDashboard | null = null;
  selectedGroupId: number | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading = false;
      this.error = 'Competencia no encontrada';
      return;
    }
    this.adminService.getRetoDashboard(id).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar el dashboard administrativo del reto';
      }
    });
  }

  get displayedTeams(): AdminRetoTeam[] {
    const teams = this.dashboard?.teams ?? [];
    if (this.selectedGroupId == null) return teams;
    return teams.filter(t => t.groupId === this.selectedGroupId);
  }

  get kpis(): AdminRetoKpis {
    if (!this.dashboard) {
      return {
        activeThisWeek: 0, totalActivities: 0, pointsToday: 0,
        pointsThisWeek: 0, avgPointsPerMember: 0, contributionPercent: 0
      };
    }
    if (this.selectedGroupId == null) return this.dashboard.kpis;
    return this.kpisFromTeams(this.displayedTeams);
  }

  get insight(): string | null {
    const teams = this.displayedTeams;
    if (!teams.length) return null;
    const leader = [...teams].sort((a, b) => a.rank - b.rank)[0];
    const contributors = leader.members.filter(m => m.points > 0).length;
    if (leader.rank === 1 && leader.contributionPercent < 50 && contributors > 0 && leader.rosterSize > contributors) {
      return `${leader.groupName} va ganando, pero solo ${contributors} ${contributors === 1 ? 'integrante está' : 'integrantes están'} generando la mayor parte de sus puntos.`;
    }
    return null;
  }

  ordinal(rank: number): string {
    if (rank === 1) return '1.er lugar';
    if (rank === 3) return '3.er lugar';
    return `${rank}.º lugar`;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', FINISHED: 'Finalizado' };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    if (status === 'ACTIVE') return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    if (status === 'FINISHED') return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  }

  bar(percent: number): number {
    return Math.max(0, Math.min(100, percent || 0));
  }

  share(value: number, team: AdminRetoTeam): number {
    const total = team.fuerzaPoints + team.librePoints + team.teamBonusPoints;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (value / total) * 100));
  }

  lastActivityLabel(iso: string | null): string {
    if (!iso) return 'Sin actividad';
    const day = new Date(iso);
    if (Number.isNaN(day.getTime())) return 'Sin actividad';
    const today = new Date();
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((startOf(today) - startOf(day)) / 86400000);
    if (diff <= 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `Hace ${diff} días`;
  }

  private kpisFromTeams(teams: AdminRetoTeam[]): AdminRetoKpis {
    const roster = teams.reduce((s, t) => s + t.rosterSize, 0);
    const active = teams.reduce((s, t) => s + t.activeThisWeek, 0);
    const score = teams.reduce((s, t) => s + t.score, 0);
    const contributors = teams.reduce((s, t) => s + t.members.filter(m => m.points > 0).length, 0);
    return {
      activeThisWeek: active,
      totalActivities: teams.reduce((s, t) => s + (t.totalActivities || 0), 0),
      pointsToday: teams.reduce((s, t) => s + (t.pointsToday || 0), 0),
      pointsThisWeek: teams.reduce((s, t) => s + (t.pointsThisWeek || 0), 0),
      avgPointsPerMember: roster === 0 ? 0 : score / roster,
      contributionPercent: roster === 0 ? 0 : (contributors * 100) / roster,
    };
  }
}
