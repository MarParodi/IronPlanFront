import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, NavigationEnd } from '@angular/router';
import { GruposService, GroupDetail, GroupMember, GroupMetrics, RetoSummary } from './services/grupos.service';
import { filter } from 'rxjs/operators';
import { Chart } from 'chart.js';
import { destroyChart, renderBarChart } from '../../core/utils/bar-chart.util';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div *ngIf="detail" class="space-y-6 max-w-4xl">
      <a routerLink="/grupos/mis-grupos"
        class="inline-flex items-center gap-1 text-sm text-ip-muted hover:text-teal-400 transition">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Mis grupos
      </a>

      <header class="space-y-2">
        <p class="text-sm text-ip-muted">{{ detail.hierarchyPath.displayPath }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-2xl font-bold text-ip-primary">{{ detail.groupName }}</h2>
          <span [class]="roleBadgeClass(detail.role === 'ADMIN')">
            {{ detail.role === 'ADMIN' ? 'Administrador' : 'Miembro' }}
          </span>
        </div>
      </header>

      <nav class="flex flex-wrap gap-2">
        <a *ngFor="let t of visibleTabs"
          [routerLink]="['/grupos', groupId, t.path]"
          routerLinkActive="detail-tab-active"
          class="detail-tab">
          {{ t.label }}
        </a>
      </nav>

      <div class="rounded-2xl bg-ip-surface border border-ip-border p-5 md:p-6">
        <section *ngIf="tab === 'resumen'" class="space-y-4">
          <h3 class="text-base font-semibold text-ip-primary">Resumen</h3>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl bg-ip-page border border-ip-border/80 p-4">
              <dt class="text-[10px] uppercase tracking-wide text-ip-primary0 font-semibold">Organización</dt>
              <dd class="mt-1 text-sm text-ip-primary">{{ detail.hierarchyPath.rootName || '—' }}</dd>
            </div>
            <div class="rounded-xl bg-ip-page border border-ip-border/80 p-4">
              <dt class="text-[10px] uppercase tracking-wide text-ip-primary0 font-semibold">Código</dt>
              <dd class="mt-1 text-sm text-ip-primary font-mono">{{ detail.groupCode }}</dd>
            </div>
            <div class="rounded-xl bg-ip-page border border-ip-border/80 p-4">
              <dt class="text-[10px] uppercase tracking-wide text-ip-primary0 font-semibold">Miembros</dt>
              <dd class="mt-1 text-sm text-ip-primary">{{ detail.memberCount }}</dd>
            </div>
            <div class="rounded-xl bg-ip-page border border-ip-border/80 p-4">
              <dt class="text-[10px] uppercase tracking-wide text-ip-primary0 font-semibold">Retos activos</dt>
              <dd class="mt-1 text-sm text-ip-primary">{{ detail.activeCompetitionsCount }}</dd>
            </div>
            <div class="rounded-xl bg-ip-page border border-ip-border/80 p-4">
              <dt class="text-[10px] uppercase tracking-wide text-ip-primary0 font-semibold">Estado</dt>
              <dd class="mt-1 text-sm" [class.text-teal-400]="detail.active" [class.text-ip-muted]="!detail.active">
                {{ detail.active ? 'Activo' : 'Inactivo' }}
              </dd>
            </div>
          </dl>
        </section>

        <section *ngIf="tab === 'miembros'" class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-ip-primary">Miembros</h3>
            <p class="text-xs text-ip-primary0 mt-1">
              Personas asignadas directamente a este grupo.
              <span *ngIf="detail.canManage"> Puedes dar de alta, cambiar rol o dar de baja.</span>
            </p>
          </div>

          <div *ngIf="detail.canManage" class="rounded-xl bg-ip-page border border-ip-border p-4 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-ip-primary0">Añadir miembro</p>
            <div class="flex flex-col sm:flex-row gap-3">
              <input [(ngModel)]="addIdentifier" type="text" class="member-input flex-1"
                placeholder="Email o nombre de usuario" [disabled]="addingMember" />
              <select [(ngModel)]="addRole" class="member-input sm:w-44" [disabled]="addingMember">
                <option value="MEMBER">Miembro</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <button type="button" class="btn-add" (click)="onAddMember()" [disabled]="addingMember || !addIdentifier.trim()">
                {{ addingMember ? 'Añadiendo...' : 'Añadir' }}
              </button>
            </div>
          </div>

          <p *ngIf="membersError" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ membersError }}</p>
          <p *ngIf="membersSuccess" class="text-sm text-teal-300 bg-teal-500/10 border border-teal-500/25 rounded-lg px-3 py-2">{{ membersSuccess }}</p>

          <div *ngIf="loadingMembers" class="text-sm text-ip-muted py-6 text-center">Cargando...</div>
          <div *ngIf="!loadingMembers && members.length" class="overflow-x-auto rounded-xl border border-ip-border">
            <table class="w-full text-sm text-left">
              <thead class="bg-ip-page text-ip-primary0 text-xs uppercase">
                <tr>
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Usuario</th>
                  <th class="px-4 py-3">Rol</th>
                  <th *ngIf="detail.canManage" class="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr *ngFor="let m of members" class="hover:bg-slate-800/30">
                  <td class="px-4 py-3 text-ip-primary">{{ m.fullName }}</td>
                  <td class="px-4 py-3 text-ip-muted">{{ m.username }}</td>
                  <td class="px-4 py-3">
                    <select *ngIf="detail.canManage"
                      [ngModel]="m.role"
                      (ngModelChange)="onRoleChange(m, $event)"
                      class="member-select"
                      [disabled]="updatingUserId === m.userId">
                      <option value="MEMBER">Miembro</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    <span *ngIf="!detail.canManage" class="text-xs font-medium"
                      [class.text-teal-400]="m.role === 'ADMIN'"
                      [class.text-ip-muted]="m.role !== 'ADMIN'">
                      {{ m.role === 'ADMIN' ? 'Administrador' : 'Miembro' }}
                    </span>
                  </td>
                  <td *ngIf="detail.canManage" class="px-4 py-3 text-right">
                    <button type="button" class="btn-remove" (click)="onRemoveMember(m)"
                      [disabled]="removingUserId === m.userId">
                      {{ removingUserId === m.userId ? '...' : 'Dar de baja' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="!loadingMembers && !members.length" class="text-sm text-ip-muted">Sin miembros asignados a este grupo.</p>
        </section>

        <section *ngIf="tab === 'retos'" class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-ip-primary">Retos</h3>
            <p class="text-xs text-ip-muted mt-1">
              Compite con otros miembros del mismo grupo por entrenamientos, sesiones o minutos activos.
            </p>
          </div>

          <div *ngIf="detail.canManage && detail.groupType === 'GRUPO'"
            class="rounded-xl bg-ip-page border border-ip-border p-4 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-ip-muted">Nuevo reto interno</p>
            <input [(ngModel)]="retoForm.name" type="text" class="member-input w-full"
              placeholder="Nombre del reto" [disabled]="creatingReto" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select [(ngModel)]="retoForm.competitionType" class="member-input" [disabled]="creatingReto">
                <option value="CHALLENGE">Reto (con fecha fin)</option>
                <option value="RANKING">Ranking permanente</option>
                <option value="VERSUS">Versus (2 personas)</option>
              </select>
              <select [(ngModel)]="retoForm.metricType" class="member-input" [disabled]="creatingReto">
                <option value="WORKOUTS_COUNT">Entrenamientos</option>
                <option value="SESSIONS">Sesiones</option>
                <option value="ACTIVE_MINUTES">Minutos activos</option>
              </select>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input [(ngModel)]="retoForm.startDate" type="date" class="member-input" [disabled]="creatingReto" />
              <input *ngIf="retoForm.competitionType === 'CHALLENGE'" [(ngModel)]="retoForm.endDate" type="date"
                class="member-input" [disabled]="creatingReto" />
            </div>
            <label class="flex items-center gap-2 text-sm text-ip-secondary cursor-pointer">
              <input type="checkbox" [(ngModel)]="retoAllMembers" [disabled]="creatingReto" />
              Inscribir a todos los miembros activos
            </label>
            <div *ngIf="!retoAllMembers" class="space-y-2 max-h-40 overflow-y-auto">
              <p class="text-xs text-ip-muted">Selecciona participantes (mínimo 2):</p>
              <label *ngFor="let m of members" class="flex items-center gap-2 text-sm text-ip-secondary">
                <input type="checkbox" [checked]="isRetoParticipant(m.userId)"
                  (change)="toggleRetoParticipant(m.userId)" [disabled]="creatingReto" />
                {{ m.fullName }}
              </label>
              <p *ngIf="!members.length" class="text-xs text-ip-muted">Carga la pestaña Miembros primero o crea el reto con todos.</p>
            </div>
            <p *ngIf="retosError" class="text-sm text-red-300">{{ retosError }}</p>
            <p *ngIf="retosSuccess" class="text-sm text-teal-300">{{ retosSuccess }}</p>
            <button type="button" class="btn-add" (click)="onCreateReto()" [disabled]="creatingReto">
              {{ creatingReto ? 'Creando...' : 'Crear y activar reto' }}
            </button>
          </div>
          <p *ngIf="detail.canManage && detail.groupType !== 'GRUPO'" class="text-xs text-ip-muted">
            Los retos entre miembros del mismo grupo solo pueden crearse en un grupo hoja (tipo GRUPO).
          </p>

          <div *ngIf="loadingRetos" class="text-sm text-ip-muted py-6 text-center">Cargando...</div>
          <article *ngFor="let r of retos"
            class="rounded-xl bg-ip-page border border-ip-border p-4 space-y-3 hover:border-ip-border transition">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-semibold text-ip-primary">{{ r.name }}</h4>
                <p class="text-xs text-ip-muted mt-1">
                  {{ retoTypeLabel(r.competitionType) }}
                  <span *ngIf="r.isMemberCompetition"> · Interno del grupo</span>
                  · {{ r.metricLabel || r.metricType }}
                  · {{ r.participantCount }} participantes
                </p>
              </div>
              <span [class]="retoStatusClass(r.status)">{{ retoStatusLabel(r.status) }}</span>
            </div>
            <div *ngIf="r.leader?.name" class="flex items-center gap-2 text-sm">
              <span>🏆</span>
              <span class="text-teal-400 font-medium">{{ r.leader?.name }}</span>
              <span class="text-ip-primary0">
                — {{ r.leader?.score | number:'1.0-1' }}
                <span *ngIf="r.leader?.tie"> (empate)</span>
              </span>
            </div>
            <a [routerLink]="['/grupos', groupId, 'retos', r.id]"
              class="inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300">
              Ver ranking completo
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </article>
          <p *ngIf="!loadingRetos && !retos.length" class="text-sm text-ip-muted">No hay retos activos o finalizados en este grupo.</p>
        </section>

        <section *ngIf="tab === 'metricas'" class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-ip-primary">Métricas organizacionales</h3>
              <p *ngIf="metrics" class="text-xs text-ip-primary0 mt-1">
                {{ metrics.periodStart | date:'dd/MM/yyyy' }} – {{ metrics.periodEnd | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <select [(ngModel)]="metricsDays" (ngModelChange)="loadMetricas(true)" class="member-select w-36">
              <option [ngValue]="7">Últimos 7 días</option>
              <option [ngValue]="30">Últimos 30 días</option>
              <option [ngValue]="90">Últimos 90 días</option>
            </select>
          </div>

          <div *ngIf="loadingMetricas" class="text-sm text-ip-muted py-8 text-center">Cargando métricas...</div>
          <p *ngIf="metricasError" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ metricasError }}</p>

          <ng-container *ngIf="!loadingMetricas && metrics">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="metric-card">
                <p class="metric-label">Adherencia</p>
                <p class="metric-value text-teal-400">{{ metrics.adherencePercent }}%</p>
                <p class="metric-hint">{{ metrics.activeMembers }} de {{ metrics.totalMembers }} activos</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Entrenamientos</p>
                <p class="metric-value">{{ metrics.totalWorkouts }}</p>
                <p class="metric-hint">Completados en el período</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Minutos activos</p>
                <p class="metric-value">{{ metrics.totalActiveMinutes }}</p>
                <p class="metric-hint">Tiempo total del grupo</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Promedio / activo</p>
                <p class="metric-value">{{ metrics.avgWorkoutsPerActiveMember }}</p>
                <p class="metric-hint">Entrenamientos por miembro activo</p>
              </div>
            </div>

            <div class="rounded-xl bg-ip-page border border-ip-border p-4 space-y-3">
              <h4 class="text-sm font-semibold text-ip-secondary">Actividad semanal (entrenamientos)</h4>
              <div *ngIf="!metrics.weeklyWorkouts.length" class="text-xs text-ip-primary0">Sin datos en el período.</div>
              <div *ngFor="let w of metrics.weeklyWorkouts" class="space-y-1">
                <div class="flex justify-between text-xs text-ip-muted">
                  <span>{{ w.weekLabel }}</span>
                  <span>{{ w.workouts }} · {{ w.activeMembers }} activos</span>
                </div>
                <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-teal-500/70 rounded-full transition-all"
                    [style.width.%]="weeklyBarWidth(w.workouts)"></div>
                </div>
              </div>
            </div>

            <div *ngIf="metrics.objectiveDistribution?.length" class="rounded-xl bg-ip-page border border-ip-border p-4 space-y-3">
              <h4 class="text-sm font-semibold text-ip-secondary">Distribución de objetivos personales</h4>
              <div class="h-56">
                <canvas #objectiveChartCanvas></canvas>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div *ngFor="let item of metrics.objectiveDistribution" class="flex justify-between text-ip-muted">
                  <span>{{ item.label }}</span>
                  <span class="text-teal-300 font-semibold">{{ item.count }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-xl bg-ip-page border border-ip-border overflow-hidden">
              <h4 class="text-sm font-semibold text-ip-secondary px-4 py-3 border-b border-ip-border">
                Top participantes
              </h4>
              <div *ngIf="!metrics.topParticipants.length" class="text-sm text-ip-primary0 px-4 py-6">
                Aún no hay actividad registrada en este grupo.
              </div>
              <table *ngIf="metrics.topParticipants.length" class="w-full text-sm text-left">
                <thead class="bg-ip-input text-ip-primary0 text-xs uppercase">
                  <tr>
                    <th class="px-4 py-2 w-10">#</th>
                    <th class="px-4 py-2">Miembro</th>
                    <th class="px-4 py-2 text-right">Entrenos</th>
                    <th class="px-4 py-2 text-right">Minutos</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  <tr *ngFor="let p of metrics.topParticipants" class="hover:bg-slate-800/30">
                    <td class="px-4 py-2 text-ip-primary0">{{ p.rank }}</td>
                    <td class="px-4 py-2">
                      <div class="text-ip-primary">{{ p.fullName }}</div>
                      <div class="text-xs text-ip-primary0">{{ p.username }}</div>
                    </td>
                    <td class="px-4 py-2 text-right text-teal-400 font-medium">{{ p.workouts }}</td>
                    <td class="px-4 py-2 text-right text-ip-muted">{{ p.activeMinutes }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </section>

        <section *ngIf="tab === 'configuracion'" class="space-y-3">
          <h3 class="text-base font-semibold text-ip-primary">Configuración</h3>
          <p class="text-sm text-ip-muted">Gestiona invitaciones, estructura y retos desde Administrar grupos.</p>
          <a routerLink="/grupos/administrar"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                   bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition">
            Ir a Administrar grupos
          </a>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .detail-tab {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      background: rgba(255,255,255,0.04);
      text-decoration: none;
      transition: all 0.15s;
    }
    .detail-tab:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); }
    .detail-tab.detail-tab-active {
      color: #2dd4bf;
      background: rgba(45,212,191,0.12);
      border: 1px solid rgba(45,212,191,0.25);
    }
    .member-input, .member-select {
      background: #0f1214;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #e2e8f0;
      padding: 8px 11px;
      font-size: 13px;
      outline: none;
    }
    .member-input:focus, .member-select:focus { border-color: rgba(45,212,191,0.5); }
    .btn-add {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      background: linear-gradient(to bottom, #5eead4, #2dd4bf);
      color: #0f172a;
      border: none;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-remove {
      font-size: 12px;
      color: #f87171;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .btn-remove:hover:not(:disabled) { background: rgba(239,68,68,0.18); }
    .btn-remove:disabled { opacity: 0.5; cursor: not-allowed; }
    .metric-card {
      border-radius: 12px;
      background: rgb(var(--ip-page));
      border: 1px solid rgb(30 41 59);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 600;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
    }
    .metric-hint {
      font-size: 11px;
      color: #64748b;
    }
  `]
})
export class GroupDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('objectiveChartCanvas') objectiveChartCanvas?: ElementRef<HTMLCanvasElement>;

  detail?: GroupDetail;
  members: GroupMember[] = [];
  retos: RetoSummary[] = [];
  tab = 'resumen';
  loadingMembers = false;
  loadingRetos = false;
  creatingReto = false;
  retosError = '';
  retosSuccess = '';
  retoAllMembers = true;
  retoSelectedUserIds: number[] = [];
  retoForm = {
    name: '',
    competitionType: 'CHALLENGE' as 'RANKING' | 'CHALLENGE' | 'VERSUS',
    metricType: 'WORKOUTS_COUNT' as 'SESSIONS' | 'ACTIVE_MINUTES' | 'WORKOUTS_COUNT',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  };
  groupId = 0;

  addIdentifier = '';
  addRole: 'MEMBER' | 'ADMIN' = 'MEMBER';
  addingMember = false;
  updatingUserId: number | null = null;
  removingUserId: number | null = null;
  membersError = '';
  membersSuccess = '';

  metrics?: GroupMetrics;
  metricsDays = 30;
  loadingMetricas = false;
  metricasError = '';
  maxWeeklyWorkouts = 1;
  private objectiveChart?: Chart;
  private objectiveChartRenderedFor?: string;

  visibleTabs: { path: string; label: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gruposService: GruposService
  ) {}

  ngOnInit(): void {
    const groupParams$ = this.route.parent?.paramMap ?? this.route.paramMap;
    groupParams$.subscribe(params => {
      this.groupId = Number(params.get('groupId'));
      this.members = [];
      this.retos = [];
      this.metrics = undefined;
      this.syncTab();
      this.loadDetail();
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.syncTab();
    });
  }

  syncTab() {
    const url = this.router.url;
    const prev = this.tab;
    if (url.includes('/miembros')) this.tab = 'miembros';
    else if (url.includes('/retos')) this.tab = 'retos';
    else if (url.includes('/metricas')) this.tab = 'metricas';
    else if (url.includes('/configuracion')) this.tab = 'configuracion';
    else this.tab = 'resumen';
    this.loadTabData(prev !== this.tab);
  }

  loadDetail() {
    if (!this.groupId || Number.isNaN(this.groupId)) {
      this.router.navigate(['/grupos/mis-grupos']);
      return;
    }
    this.gruposService.getResumen(this.groupId).subscribe({
      next: (d) => {
        this.detail = d;
        this.visibleTabs = [
          { path: 'resumen', label: 'Resumen' },
          { path: 'miembros', label: 'Miembros' },
          { path: 'retos', label: 'Retos' },
        ];
        if (d.canManage) {
          this.visibleTabs.push({ path: 'metricas', label: 'Métricas org.' });
          this.visibleTabs.push({ path: 'configuracion', label: 'Configuración' });
        }
        this.loadTabData(true);
      },
      error: () => this.router.navigate(['/grupos/mis-grupos'])
    });
  }

  roleBadgeClass(isAdmin: boolean): string {
    return isAdmin
      ? 'text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/25'
      : 'text-xs font-semibold px-2.5 py-1 rounded-md bg-ip-surface/50 text-ip-secondary';
  }

  statusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-500/15 text-teal-400'
      : 'text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-ip-surface/50 text-ip-muted';
  }

  retoTypeLabel(t: string): string {
    const m: Record<string, string> = { RANKING: 'Ranking', CHALLENGE: 'Reto', VERSUS: 'Versus' };
    return m[t] ?? t;
  }

  retoStatusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activo', FINISHED: 'Finalizado', DRAFT: 'Borrador' };
    return m[s] ?? s;
  }

  retoStatusClass(s: string): string {
    const base = 'text-[10px] font-semibold uppercase px-2 py-0.5 rounded';
    if (s === 'ACTIVE') return `${base} bg-teal-500/15 text-teal-400`;
    if (s === 'FINISHED') return `${base} bg-slate-600/40 text-ip-secondary`;
    return `${base} bg-ip-surface/50 text-ip-muted`;
  }

  loadMembers(force = false) {
    if (!this.groupId) return;
    if (!force && this.members.length) return;
    this.loadingMembers = true;
    this.membersError = '';
    this.gruposService.getMiembros(this.groupId).subscribe({
      next: (m) => { this.members = m; this.loadingMembers = false; },
      error: () => { this.loadingMembers = false; this.membersError = 'No se pudo cargar la lista de miembros'; }
    });
  }

  onAddMember() {
    const identifier = this.addIdentifier.trim();
    if (!identifier) return;
    this.addingMember = true;
    this.membersError = '';
    this.membersSuccess = '';
    this.gruposService.addMiembro(this.groupId, { identifier, membershipRole: this.addRole }).subscribe({
      next: () => {
        this.addingMember = false;
        this.addIdentifier = '';
        this.membersSuccess = 'Miembro añadido correctamente';
        this.loadMembers(true);
        this.refreshDetailCounts();
      },
      error: (err) => {
        this.addingMember = false;
        this.membersError = this.apiError(err, 'No se pudo añadir el miembro');
      }
    });
  }

  onRoleChange(m: GroupMember, role: 'MEMBER' | 'ADMIN') {
    if (m.role === role) return;
    this.updatingUserId = m.userId;
    this.membersError = '';
    this.membersSuccess = '';
    this.gruposService.updateMiembroRol(this.groupId, m.userId, role).subscribe({
      next: (updated) => {
        m.role = updated.role;
        this.updatingUserId = null;
        this.membersSuccess = 'Rol actualizado';
      },
      error: (err) => {
        this.updatingUserId = null;
        this.membersError = this.apiError(err, 'No se pudo cambiar el rol');
        this.loadMembers(true);
      }
    });
  }

  onRemoveMember(m: GroupMember) {
    if (!confirm(`¿Dar de baja a ${m.fullName} de este grupo?`)) return;
    this.removingUserId = m.userId;
    this.membersError = '';
    this.membersSuccess = '';
    this.gruposService.removeMiembro(this.groupId, m.userId).subscribe({
      next: () => {
        this.removingUserId = null;
        this.membersSuccess = 'Miembro dado de baja';
        this.loadMembers(true);
        this.refreshDetailCounts();
      },
      error: (err) => {
        this.removingUserId = null;
        this.membersError = this.apiError(err, 'No se pudo dar de baja al miembro');
      }
    });
  }

  private apiError(err: any, fallback: string): string {
    return err?.error?.error || err?.error?.message || fallback;
  }

  refreshDetailCounts() {
    this.gruposService.getResumen(this.groupId).subscribe({
      next: (d) => { if (this.detail) this.detail.memberCount = d.memberCount; }
    });
  }

  loadMetricas(force = false) {
    if (!this.groupId || Number.isNaN(this.groupId)) return;
    if (!force && this.metrics) return;
    this.loadingMetricas = true;
    this.metricasError = '';
    destroyChart(this.objectiveChart);
    this.objectiveChart = undefined;
    this.objectiveChartRenderedFor = undefined;
    this.gruposService.getMetricas(this.groupId, this.metricsDays).subscribe({
      next: (m) => {
        this.metrics = m;
        this.maxWeeklyWorkouts = Math.max(1, ...m.weeklyWorkouts.map(w => w.workouts));
        this.loadingMetricas = false;
      },
      error: (err) => {
        this.loadingMetricas = false;
        this.metricasError = this.apiError(err, 'No se pudieron cargar las métricas');
      }
    });
  }

  ngAfterViewChecked(): void {
    this.renderObjectiveChartIfReady();
  }

  ngOnDestroy(): void {
    destroyChart(this.objectiveChart);
  }

  private renderObjectiveChartIfReady(): void {
    const distribution = this.metrics?.objectiveDistribution;
    if (!distribution?.length || !this.objectiveChartCanvas?.nativeElement) return;

    const key = `${this.groupId}-${this.metricsDays}-${distribution.map(d => d.count).join(',')}`;
    if (this.objectiveChartRenderedFor === key) return;

    destroyChart(this.objectiveChart);
    this.objectiveChart = renderBarChart(
      this.objectiveChartCanvas.nativeElement,
      distribution.map((d) => d.label),
      distribution.map((d) => d.count),
      { label: 'Miembros', color: 'rgba(45, 212, 191, 0.85)' }
    );
    this.objectiveChartRenderedFor = key;
  }

  weeklyBarWidth(workouts: number): number {
    return Math.min(100, Math.round((workouts / this.maxWeeklyWorkouts) * 100));
  }

  loadTabData(force = false) {
    if (!this.groupId || Number.isNaN(this.groupId)) return;
    if (this.tab === 'miembros') {
      this.loadMembers(force);
    }
    if (this.tab === 'metricas') {
      this.loadMetricas(force);
    }
    if (this.tab === 'retos' && (force || !this.retos.length)) {
      this.loadingRetos = true;
      this.gruposService.getRetos(this.groupId).subscribe({
        next: (r) => { this.retos = r; this.loadingRetos = false; },
        error: () => { this.loadingRetos = false; }
      });
      if (this.detail?.canManage) {
        this.loadMembers(force);
      }
    }
  }

  isRetoParticipant(userId: number): boolean {
    return this.retoSelectedUserIds.includes(userId);
  }

  toggleRetoParticipant(userId: number) {
    if (this.retoSelectedUserIds.includes(userId)) {
      this.retoSelectedUserIds = this.retoSelectedUserIds.filter(id => id !== userId);
    } else {
      this.retoSelectedUserIds = [...this.retoSelectedUserIds, userId];
    }
  }

  onCreateReto() {
    this.retosError = '';
    this.retosSuccess = '';
    const name = this.retoForm.name.trim();
    if (!name) { this.retosError = 'El nombre es obligatorio'; return; }
    if (!this.retoForm.startDate) { this.retosError = 'Indica la fecha de inicio'; return; }
    if (this.retoForm.competitionType === 'CHALLENGE' && !this.retoForm.endDate) {
      this.retosError = 'Un reto con fecha fin requiere la fecha de término'; return;
    }
    if (!this.retoAllMembers) {
      if (this.retoSelectedUserIds.length < 2) {
        this.retosError = 'Selecciona al menos 2 miembros o usa "todos los miembros"'; return;
      }
      if (this.retoForm.competitionType === 'VERSUS' && this.retoSelectedUserIds.length !== 2) {
        this.retosError = 'Versus requiere exactamente 2 participantes'; return;
      }
    }

    this.creatingReto = true;
    const payload = {
      name,
      competitionType: this.retoForm.competitionType,
      metricType: this.retoForm.metricType,
      startDate: this.retoForm.startDate,
      endDate: this.retoForm.competitionType === 'CHALLENGE' ? this.retoForm.endDate : undefined,
      participantUserIds: this.retoAllMembers ? undefined : this.retoSelectedUserIds,
    };

    this.gruposService.createReto(this.groupId, payload).subscribe({
      next: (created) => {
        this.gruposService.activateReto(this.groupId, created.id).subscribe({
          next: () => {
            this.creatingReto = false;
            this.retosSuccess = 'Reto creado y activado';
            this.retoForm.name = '';
            this.retoSelectedUserIds = [];
            this.loadTabData(true);
            this.gruposService.getResumen(this.groupId).subscribe({
              next: (d) => { if (this.detail) this.detail.activeCompetitionsCount = d.activeCompetitionsCount; }
            });
          },
          error: (err) => {
            this.creatingReto = false;
            this.retosError = this.apiError(err, 'Reto creado pero no se pudo activar');
            this.loadTabData(true);
          }
        });
      },
      error: (err) => {
        this.creatingReto = false;
        this.retosError = this.apiError(err, 'No se pudo crear el reto');
      }
    });
  }
}
