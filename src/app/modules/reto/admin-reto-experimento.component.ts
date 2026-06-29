import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RetoService } from './services/reto.service';
import { AdminService } from '../home/services/admin.service';
import { CreateRetoRequest, CompetitionCandidate, ExperimentoEstado, RetoResumen, SusResumen } from './models/reto.models';

interface ScopeNode { id: number; name: string; groupType: string; }

@Component({
  selector: 'app-admin-reto-experimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="loadingList" class="text-sm text-ip-muted py-8 text-center">Cargando experimentos...</div>

    <!-- Sin retos: formulario de creación -->
    <div *ngIf="!loadingList && retos.length === 0" class="setup-panel">
      <h2 class="setup-title">Configurar reto experimental</h2>
      <p class="setup-desc">
        Crea el registro del experimento de tesis. Después podrás vincular una competencia
        (ranking de volumen) y activarlo para que los usuarios se inscriban.
      </p>

      <div class="form-grid">
        <div class="field full">
          <label>Nombre del reto</label>
          <input [(ngModel)]="createForm.nombre" type="text" class="input" placeholder="Pongámonos en Forma 2026"/>
        </div>
        <div class="field full">
          <label>Descripción (opcional)</label>
          <textarea [(ngModel)]="createForm.descripcion" class="input textarea" rows="2"
            placeholder="Experimento de tesis UAS"></textarea>
        </div>
        <div class="field full">
          <label>Organización</label>
          <select [(ngModel)]="createForm.organizacionId" class="input" (change)="onOrgChange()">
            <option [ngValue]="0">Selecciona organización</option>
            <option *ngFor="let org of rootOrgs" [ngValue]="org.id">{{ org.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Fecha inicio</label>
          <input [(ngModel)]="createForm.fechaInicio" type="date" class="input"/>
        </div>
        <div class="field">
          <label>Fecha fin</label>
          <input [(ngModel)]="createForm.fechaFin" type="date" class="input"/>
        </div>
        <div class="field">
          <label>Semanas de intervención</label>
          <input [(ngModel)]="createForm.semanasIntervencion" type="number" min="1" max="52" class="input"/>
        </div>
        <div class="field full">
          <label>Competencia vinculada (opcional)</label>
          <select [(ngModel)]="createForm.competitionId" class="input">
            <option [ngValue]="null">Sin vincular — puedes hacerlo después</option>
            <option *ngFor="let c of linkableCompetitions" [ngValue]="c.id">
              {{ c.name }} ({{ c.status }}) — {{ c.metricType }}
            </option>
          </select>
          <p class="hint" *ngIf="createForm.organizacionId && linkableCompetitions.length === 0">
            No hay competencias en esta organización. Créala primero en Competencias.
          </p>
          <p class="hint">Recomendado: Challenge con métrica Volumen total y modo Miembros org.</p>
        </div>
      </div>

      <p *ngIf="error" class="error">{{ error }}</p>
      <button type="button" class="btn-primary" (click)="crearReto()" [disabled]="busy">
        {{ busy ? 'Creando...' : 'Crear reto experimental' }}
      </button>
    </div>

    <!-- Con retos: selector + panel -->
    <div *ngIf="!loadingList && retos.length > 0" class="space-y-6">
      <div class="reto-toolbar">
        <select *ngIf="retos.length > 1" [(ngModel)]="selectedRetoId" (change)="onRetoSelected()" class="input reto-select">
          <option *ngFor="let r of retos" [ngValue]="r.id">{{ r.nombre }} ({{ r.estado }})</option>
        </select>
        <button type="button" class="btn-secondary" (click)="toggleCreateForm()">
          {{ showCreateForm ? 'Cancelar' : '+ Nuevo reto' }}
        </button>
        <button *ngIf="selectedRetoId && !showCreateForm && selectedReto?.estado !== 'ACTIVO'"
          type="button" class="btn-danger" (click)="eliminar()" [disabled]="busy">
          Eliminar experimento
        </button>
      </div>

      <div *ngIf="showCreateForm" class="setup-panel nested">
        <h3 class="setup-title">Nuevo reto experimental</h3>
        <div class="form-grid">
          <div class="field full">
            <label>Nombre</label>
            <input [(ngModel)]="createForm.nombre" type="text" class="input"/>
          </div>
          <div class="field full">
            <label>Organización</label>
            <select [(ngModel)]="createForm.organizacionId" class="input" (change)="onOrgChange()">
              <option [ngValue]="0">Selecciona</option>
              <option *ngFor="let org of rootOrgs" [ngValue]="org.id">{{ org.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Inicio</label>
            <input [(ngModel)]="createForm.fechaInicio" type="date" class="input"/>
          </div>
          <div class="field">
            <label>Fin</label>
            <input [(ngModel)]="createForm.fechaFin" type="date" class="input"/>
          </div>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
        <button type="button" class="btn-primary" (click)="crearReto()" [disabled]="busy">Crear</button>
      </div>

      <ng-container *ngIf="selectedRetoId && !showCreateForm">
        <!-- Vincular competencia -->
        <div class="link-panel">
          <h3 class="link-title">Competencia vinculada</h3>
          <p class="link-desc">
            Organización: <strong>{{ selectedReto?.organizacionNombre }}</strong>.
            Solo se listan competencias de esa organización (la competencia puede estar en cualquier nivel interno).
          </p>
          <div class="link-row">
            <select [(ngModel)]="selectedCompetitionId" class="input flex-1" [disabled]="loadingCompetitions">
              <option [ngValue]="null">Sin competencia vinculada</option>
              <option *ngFor="let c of linkableCompetitions" [ngValue]="c.id">
                #{{ c.id }} — {{ c.name }} ({{ c.status }}) · {{ c.metricType }}
              </option>
            </select>
            <button type="button" class="btn-secondary" (click)="guardarVinculo()" [disabled]="busy || !vinculoCambiado()">
              Guardar vínculo
            </button>
          </div>
          <p *ngIf="loadingCompetitions" class="hint">Cargando competencias...</p>
          <p *ngIf="!loadingCompetitions && linkableCompetitions.length === 0" class="hint warn">
            No hay competencias en <strong>{{ selectedReto?.organizacionNombre }}</strong>.
            Ve a Competencias y crea un Challenge con Volumen total y Miembros org. usando esa organización.
          </p>
          <p *ngIf="selectedReto?.competitionId" class="hint ok">
            Vinculada: competencia #{{ selectedReto!.competitionId }}
          </p>
          <p *ngIf="!selectedReto?.competitionId && linkableCompetitions.length > 0" class="hint warn">
            Sin competencia vinculada — selecciona una del listado y guarda.
          </p>
        </div>

        <div *ngIf="loadingDetail" class="text-sm text-ip-muted py-4 text-center">Cargando estado...</div>
        <p *ngIf="detailError" class="error">{{ detailError }}</p>

        <div *ngIf="estado && !loadingDetail">
          <header class="mb-4">
            <h2 class="text-xl font-bold text-ip-primary">{{ estado.nombre }}</h2>
            <p class="text-sm text-ip-muted">
              {{ selectedReto?.organizacionNombre }} · Estado: {{ estado.estado }} ·
              {{ estado.fechaInicio }} — {{ estado.fechaFin }} ·
              {{ estado.semanasIntervencion }} sem. intervención
            </p>
          </header>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div class="stat-card"><p class="stat-label">Inscritos</p><p class="stat-value">{{ estado.participantesInscritos }}</p></div>
            <div class="stat-card"><p class="stat-label">Pre-test IPAQ</p><p class="stat-value">{{ estado.completaronPretest }} / {{ estado.participantesInscritos }}</p></div>
            <div class="stat-card"><p class="stat-label">Post-test IPAQ</p><p class="stat-value">{{ estado.completaronPosttest }} / {{ estado.participantesInscritos }}</p></div>
            <div class="stat-card"><p class="stat-label">SUS</p><p class="stat-value">{{ estado.completaronSus }} / {{ estado.participantesInscritos }}</p></div>
            <div class="stat-card"><p class="stat-label">Activos</p><p class="stat-value">{{ estado.participantesActivos }}</p></div>
            <div class="stat-card" *ngIf="susResumen?.promedioSus">
              <p class="stat-label">Promedio SUS</p>
              <p class="stat-value">{{ susResumen!.promedioSus | number:'1.1-1' }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button *ngIf="estado.estado === 'PLANEACION'" type="button" class="action-btn primary" (click)="activar()" [disabled]="busy">Activar reto</button>
            <button type="button" class="action-btn" (click)="activarPosttest()" [disabled]="busy || estado.posttestIpaqActivo">Abrir post-test IPAQ</button>
            <button type="button" class="action-btn" (click)="activarSus()" [disabled]="busy || estado.susActivo">Abrir encuesta SUS</button>
            <button type="button" class="action-btn" (click)="snapshots()" [disabled]="busy">Generar snapshots</button>
            <button type="button" class="action-btn export" (click)="exportar()" [disabled]="busy">Exportar CSV</button>
            <button type="button" class="action-btn danger" (click)="cerrar()" [disabled]="busy || estado.estado === 'CERRADO'">Cerrar reto</button>
            <button *ngIf="estado.estado !== 'ACTIVO'" type="button" class="action-btn danger-outline" (click)="eliminar()" [disabled]="busy">Eliminar experimento</button>
          </div>
          <p class="hint">
            Snapshots: genera semanas faltantes (1–{{ estado.semanasIntervencion }}).
            Al cerrar el reto se generan retroactivamente. Piloto de 1 semana → usa columnas
            <em>volumen_semana_inicio/fin</em> en el CSV (ambas = semana 1).
          </p>
          <p *ngIf="estado.estado === 'ACTIVO'" class="hint warn">Para eliminar, cierra el reto primero.</p>

          <p *ngIf="actionMsg" class="success-msg">{{ actionMsg }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .setup-panel {
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.15);
      border-radius: 14px; padding: 24px; max-width: 640px;
    }
    .setup-panel.nested { margin-bottom: 16px; max-width: 100%; }
    .setup-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px; }
    .setup-desc { font-size: 13px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .input {
      background: rgba(15,23,42,0.8); border: 1px solid rgba(148,163,184,0.2);
      border-radius: 8px; padding: 10px 12px; color: #e2e8f0; font-size: 14px; width: 100%;
    }
    .textarea { resize: vertical; min-height: 60px; }
    .hint { font-size: 12px; color: #64748b; margin: 6px 0 0; }
    .hint.ok { color: #2dd4bf; }
    .hint.warn { color: #fbbf24; }
    .error { font-size: 13px; color: #fca5a5; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
    .success-msg { font-size: 13px; color: #2dd4bf; margin-top: 12px; }
    .btn-primary {
      background: #2dd4bf; color: #0f172a; border: none; border-radius: 8px;
      padding: 10px 20px; font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: transparent; color: #94a3b8; border: 1px solid rgba(148,163,184,0.25);
      border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
    }
    .btn-danger {
      background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.35);
      border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; margin-left: auto;
    }
    .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }
    .reto-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .reto-select { max-width: 360px; }
    .link-panel {
      background: rgba(45,212,191,0.06); border: 1px solid rgba(45,212,191,0.2);
      border-radius: 12px; padding: 16px; margin-bottom: 20px;
    }
    .link-title { font-size: 14px; font-weight: 600; color: #2dd4bf; margin: 0 0 4px; }
    .link-desc { font-size: 12px; color: #94a3b8; margin: 0 0 12px; }
    .link-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 200px; }
    .stat-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.12); border-radius: 12px; padding: 14px; }
    .stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; margin: 0; }
    .stat-value { font-size: 22px; font-weight: 700; color: #2dd4bf; margin: 4px 0 0; }
    .action-btn {
      padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.25);
      background: transparent; color: #cbd5e1; font-size: 13px; cursor: pointer;
    }
    .action-btn:hover:not(:disabled) { border-color: rgba(45,212,191,0.4); }
    .action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .action-btn.primary { background: rgba(45,212,191,0.15); border-color: rgba(45,212,191,0.35); color: #2dd4bf; font-weight: 600; }
    .action-btn.export { background: #2dd4bf; color: #0f172a; border-color: #2dd4bf; font-weight: 600; }
    .action-btn.danger { border-color: rgba(239,68,68,0.35); color: #fca5a5; }
    .action-btn.danger-outline { border-color: rgba(239,68,68,0.35); color: #fca5a5; background: rgba(239,68,68,0.08); }
  `],
})
export class AdminRetoExperimentoComponent implements OnInit {
  loadingList = true;
  loadingDetail = false;
  busy = false;
  error = '';
  detailError = '';
  actionMsg = '';
  showCreateForm = false;

  retos: RetoResumen[] = [];
  selectedRetoId: number | null = null;
  selectedCompetitionId: number | null = null;

  rootOrgs: ScopeNode[] = [];
  linkableCompetitions: CompetitionCandidate[] = [];
  loadingCompetitions = false;

  estado: ExperimentoEstado | null = null;
  susResumen: SusResumen | null = null;

  createForm = {
    nombre: 'Pongámonos en Forma 2026',
    descripcion: 'Reto HTI · GTS · CTN — experimento de tesis UAS',
    organizacionId: 0,
    fechaInicio: '2026-07-01',
    fechaFin: '2026-09-01',
    semanasIntervencion: 8,
    competitionId: null as number | null,
  };

  constructor(
    private retoService: RetoService,
    private adminService: AdminService,
  ) {}

  get selectedReto(): RetoResumen | undefined {
    return this.retos.find(r => r.id === this.selectedRetoId);
  }

  ngOnInit(): void {
    this.loadOrgs();
    this.loadRetos();
  }

  loadOrgs(): void {
    this.adminService.getGroups({ type: 'EMPRESA', active: 'true' }).subscribe({
      next: (data) => {
        this.rootOrgs = data.map((g: { id: number; name: string; groupType: string }) => ({
          id: g.id, name: g.name, groupType: g.groupType,
        }));
        if (this.rootOrgs.length === 1) {
          this.createForm.organizacionId = this.rootOrgs[0].id;
          this.loadLinkableCompetitionsForOrg(this.rootOrgs[0].id);
        }
      },
    });
  }

  loadLinkableCompetitionsForReto(retoId: number): void {
    this.loadingCompetitions = true;
    this.retoService.listCompetenciasCandidatas(retoId).subscribe({
      next: (data) => {
        this.linkableCompetitions = data;
        this.loadingCompetitions = false;
      },
      error: () => {
        this.linkableCompetitions = [];
        this.loadingCompetitions = false;
      },
    });
  }

  loadLinkableCompetitionsForOrg(orgId: number): void {
    if (!orgId) {
      this.linkableCompetitions = [];
      return;
    }
    this.loadingCompetitions = true;
    this.retoService.listCompetenciasCandidatasPorOrg(orgId).subscribe({
      next: (data) => {
        this.linkableCompetitions = data;
        this.loadingCompetitions = false;
      },
      error: () => {
        this.linkableCompetitions = [];
        this.loadingCompetitions = false;
      },
    });
  }

  loadRetos(): void {
    this.loadingList = true;
    this.retoService.listRetosAdmin().subscribe({
      next: (retos) => {
        this.retos = retos;
        this.loadingList = false;
        if (retos.length === 0) {
          this.selectedRetoId = null;
          return;
        }
        const stillExists = this.selectedRetoId && retos.some(r => r.id === this.selectedRetoId);
        if (!stillExists) {
          this.selectedRetoId = retos[0].id;
        }
        this.syncCompetitionSelection();
        if (this.selectedRetoId) {
          this.loadLinkableCompetitionsForReto(this.selectedRetoId);
          this.loadDetail();
        }
      },
      error: () => {
        this.loadingList = false;
        this.error = 'No se pudo cargar la lista de retos experimentales.';
      },
    });
  }

  onOrgChange(): void {
    this.createForm.competitionId = null;
    this.loadLinkableCompetitionsForOrg(this.createForm.organizacionId);
  }

  onRetoSelected(): void {
    this.syncCompetitionSelection();
    if (this.selectedRetoId) {
      this.loadLinkableCompetitionsForReto(this.selectedRetoId);
    }
    this.loadDetail();
  }

  syncCompetitionSelection(): void {
    this.selectedCompetitionId = this.selectedReto?.competitionId ?? null;
  }

  vinculoCambiado(): boolean {
    return this.selectedCompetitionId !== (this.selectedReto?.competitionId ?? null);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.error = '';
  }

  crearReto(): void {
    if (!this.createForm.nombre.trim()) {
      this.error = 'Indica el nombre del reto';
      return;
    }
    if (!this.createForm.organizacionId) {
      this.error = 'Selecciona una organización';
      return;
    }
    if (!this.createForm.fechaInicio || !this.createForm.fechaFin) {
      this.error = 'Indica fechas de inicio y fin';
      return;
    }

    const body: CreateRetoRequest = {
      nombre: this.createForm.nombre.trim(),
      descripcion: this.createForm.descripcion?.trim() || undefined,
      organizacionId: this.createForm.organizacionId,
      fechaInicio: this.createForm.fechaInicio,
      fechaFin: this.createForm.fechaFin,
      semanasIntervencion: this.createForm.semanasIntervencion,
      competitionId: this.createForm.competitionId ?? undefined,
    };

    this.busy = true;
    this.error = '';
    this.retoService.createRetoAdmin(body).subscribe({
      next: (reto) => {
        this.busy = false;
        this.showCreateForm = false;
        this.retos = [...this.retos, reto];
        this.selectedRetoId = reto.id;
        this.syncCompetitionSelection();
        this.loadDetail();
        this.actionMsg = 'Reto experimental creado.';
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message || err?.error || 'Error al crear el reto.';
      },
    });
  }

  guardarVinculo(): void {
    if (!this.selectedRetoId) return;
    this.busy = true;
    this.detailError = '';
    this.retoService.vincularCompetition(this.selectedRetoId, this.selectedCompetitionId).subscribe({
      next: (reto) => {
        this.busy = false;
        const idx = this.retos.findIndex(r => r.id === reto.id);
        if (idx >= 0) this.retos[idx] = reto;
        this.actionMsg = this.selectedCompetitionId
          ? `Competencia #${this.selectedCompetitionId} vinculada.`
          : 'Competencia desvinculada.';
        this.loadDetail();
      },
      error: (err) => {
        this.busy = false;
        this.detailError = err?.error?.message || err?.error || 'No se pudo vincular la competencia.';
      },
    });
  }

  loadDetail(): void {
    if (!this.selectedRetoId) return;
    this.loadingDetail = true;
    this.detailError = '';
    this.retoService.getExperimentoEstado(this.selectedRetoId).subscribe({
      next: (e) => {
        this.estado = e;
        this.loadingDetail = false;
        this.retoService.getSusResumen(this.selectedRetoId!).subscribe({
          next: (s) => this.susResumen = s,
          error: () => {},
        });
      },
      error: () => {
        this.detailError = 'No se pudo cargar el estado del experimento.';
        this.loadingDetail = false;
      },
    });
  }

  activar(): void { this.run(() => this.retoService.activarReto(this.selectedRetoId!), 'Reto activado.'); }
  activarPosttest(): void { this.run(() => this.retoService.activarPosttest(this.selectedRetoId!), 'Post-test IPAQ activado.'); }
  activarSus(): void { this.run(() => this.retoService.activarSus(this.selectedRetoId!), 'Encuesta SUS activada.'); }
  cerrar(): void {
    this.run(() => this.retoService.cerrarReto(this.selectedRetoId!), 'Reto cerrado. Snapshots generados automáticamente.');
  }

  snapshots(): void {
    if (!this.selectedRetoId) return;
    this.busy = true;
    this.actionMsg = '';
    this.detailError = '';
    this.retoService.generarSnapshots(this.selectedRetoId).subscribe({
      next: (r) => {
        this.busy = false;
        this.actionMsg = r.usuariosProcesados > 0
          ? `${r.usuariosProcesados} snapshot(s) creados (hasta semana ${r.semanaGenerada}).`
          : `No había snapshots pendientes (hasta semana ${r.semanaGenerada}).`;
        this.loadDetail();
      },
      error: () => { this.busy = false; this.detailError = 'Error al generar snapshots.'; },
    });
  }

  exportar(): void {
    if (!this.selectedRetoId) return;
    this.busy = true;
    this.retoService.exportarCsv(this.selectedRetoId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ironplan_datos_reto_${this.selectedRetoId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.busy = false;
        this.actionMsg = 'CSV descargado.';
      },
      error: () => { this.busy = false; this.detailError = 'Error al exportar CSV.'; },
    });
  }

  eliminar(): void {
    if (!this.selectedRetoId || !this.selectedReto) return;
    if (this.selectedReto.estado === 'ACTIVO') {
      this.detailError = 'Cierra el reto antes de eliminarlo.';
      return;
    }
    const msg = `¿Eliminar el experimento "${this.selectedReto.nombre}"?\n\nSe borrarán inscripciones, IPAQ, SUS y snapshots asociados. Esta acción no se puede deshacer.`;
    if (!confirm(msg)) return;

    this.busy = true;
    this.detailError = '';
    this.retoService.deleteReto(this.selectedRetoId).subscribe({
      next: () => {
        this.busy = false;
        this.selectedRetoId = null;
        this.estado = null;
        this.actionMsg = 'Experimento eliminado.';
        this.loadRetos();
      },
      error: (err) => {
        this.busy = false;
        this.detailError = err?.error?.message || err?.error || 'No se pudo eliminar el experimento.';
      },
    });
  }

  private run(op: () => Observable<unknown>, msg: string): void {
    this.busy = true;
    this.actionMsg = '';
    op().subscribe({
      next: () => {
        this.busy = false;
        this.actionMsg = msg;
        this.loadRetos();
        this.loadDetail();
      },
      error: () => { this.busy = false; this.detailError = 'Acción fallida.'; },
    });
  }
}
