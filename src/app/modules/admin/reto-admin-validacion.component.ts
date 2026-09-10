import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ADMIN_REVIEW_FLAG_LABELS,
  AdminActivityReviewItem,
  AdminReviewFlag,
  AdminReviewStatus,
  AdminService,
} from '../home/services/admin.service';

@Component({
  selector: 'app-reto-admin-validacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-3">
      <div>
        <h3 class="text-sm font-semibold text-ip-secondary">Validación de actividades</h3>
        <p class="text-xs text-ip-muted mt-1">
          Identifica registros que pueden requerir revisión. Marcar una actividad no cambia los puntos.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" *ngFor="let opt of filterOptions"
          class="text-xs px-2.5 py-1 rounded-lg border transition"
          [ngClass]="selectedFlag === opt.id
            ? 'border-teal-500/40 bg-teal-500/10 text-teal-300'
            : 'border-ip-border text-ip-muted hover:text-ip-primary'"
          (click)="selectFlag(opt.id)">
          {{ opt.label }}
        </button>
      </div>

      <p *ngIf="error" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</p>

      <div class="rounded-2xl border border-ip-border bg-ip-surface overflow-hidden">
        <div *ngIf="loading" class="px-4 py-10 text-center text-sm text-ip-muted">Cargando registros a revisar...</div>
        <div class="overflow-x-auto" *ngIf="!loading">
          <table class="w-full text-sm text-left">
            <thead class="bg-ip-page text-ip-primary0 text-xs uppercase">
              <tr>
                <th class="px-4 py-3">Participante</th>
                <th class="px-4 py-3">Actividad</th>
                <th class="px-4 py-3 text-right">Duración</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Sugeridas</th>
                <th class="px-4 py-3">Admin</th>
                <th class="px-4 py-3">Evidencia</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let item of items" class="hover:bg-slate-800/30">
                <td class="px-4 py-3">
                  <button type="button" class="text-ip-primary font-medium hover:text-teal-300" (click)="openHistory.emit(item)">
                    {{ item.fullName }}
                  </button>
                </td>
                <td class="px-4 py-3 text-ip-primary">{{ item.activityLabel }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-ip-muted">
                  {{ item.durationMinutes != null ? item.durationMinutes + ' min' : '—' }}
                </td>
                <td class="px-4 py-3 text-ip-muted whitespace-nowrap">{{ item.occurredAt | date:'dd/MM HH:mm' }}</td>
                <td class="px-4 py-3">
                  <span *ngFor="let f of item.suggestedFlags"
                    class="inline-block text-[10px] mr-1 mb-1 px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-200">
                    {{ labelOf(f) }}
                  </span>
                  <span *ngIf="!item.suggestedFlags.length" class="text-ip-muted">—</span>
                </td>
                <td class="px-4 py-3">
                  <span *ngFor="let f of item.adminFlags"
                    class="inline-block text-[10px] mr-1 mb-1 px-1.5 py-0.5 rounded border border-teal-500/30 text-teal-200">
                    {{ labelOf(f) }}
                  </span>
                  <span *ngIf="!item.adminFlags.length" class="text-xs text-ip-muted">{{ item.reviewStatus === 'REVIEWED' ? 'Revisada' : '—' }}</span>
                </td>
                <td class="px-4 py-3">
                  <a *ngIf="item.evidenceUrl" [href]="item.evidenceUrl" target="_blank" rel="noopener" class="text-xs text-teal-400 hover:underline">Ver</a>
                  <span *ngIf="!item.evidenceUrl" class="text-ip-muted">—</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="text-xs text-teal-400 hover:underline" (click)="openMark(item)">Marcar</button>
                </td>
              </tr>
              <tr *ngIf="!items.length">
                <td colspan="8" class="px-4 py-6 text-center text-ip-muted">
                  No hay registros que coincidan con este filtro.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <div *ngIf="editing" class="modal-overlay" (click)="cancelMark()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Revisar actividad</h2>
            <p class="text-xs text-ip-muted mt-1">{{ editing.fullName }} · {{ editing.activityLabel }} · {{ editing.durationMinutes }} min</p>
          </div>
          <button type="button" class="modal-close" (click)="cancelMark()">×</button>
        </div>
        <div class="modal-body space-y-4">
          <div class="space-y-2">
            <p class="text-xs font-semibold text-ip-secondary">Etiquetas</p>
            <label *ngFor="let flag of allFlags" class="flex items-center gap-2 text-sm text-ip-primary">
              <input type="checkbox" [checked]="draftFlags.includes(flag)" (change)="toggleFlag(flag)">
              {{ labelOf(flag) }}
            </label>
          </div>
          <label class="block text-xs text-ip-muted">
            Nota
            <textarea [(ngModel)]="draftNote" rows="3"
              class="mt-1 w-full rounded-lg border border-ip-border bg-ip-page px-3 py-2 text-sm text-ip-primary"></textarea>
          </label>
          <label class="block text-xs text-ip-muted">
            Estado
            <select [(ngModel)]="draftStatus" class="member-select mt-1 w-full">
              <option value="PENDING_REVIEW">Pendiente</option>
              <option value="REVIEWED">Revisada</option>
            </select>
          </label>
          <p *ngIf="saveError" class="text-sm text-red-300">{{ saveError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="cancelMark()">Cancelar</button>
          <button type="button" class="btn-primary" [disabled]="saving" (click)="saveMark()">
            {{ saving ? 'Guardando...' : 'Guardar revisión' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 70;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: rgb(var(--ip-surface)); border: 1px solid var(--ip-card-border-color);
      border-radius: 20px; width: 100%; max-width: 440px;
      max-height: 90vh; display: flex; flex-direction: column;
    }
    .modal-header {
      padding: 18px 20px 0; display: flex; justify-content: space-between; gap: 12px;
    }
    .modal-header h2 { font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0; }
    .modal-close {
      width: 28px; height: 28px; border: none; background: transparent; color: #64748b; cursor: pointer; font-size: 20px;
    }
    .modal-body { padding: 16px 20px; overflow-y: auto; }
    .modal-footer {
      padding: 12px 20px 16px; display: flex; justify-content: flex-end; gap: 8px;
    }
    .member-select {
      background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0;
      border-radius: 0.75rem; padding: 0.55rem 0.75rem; font-size: 0.875rem;
    }
    .btn-secondary {
      background: transparent; border: 1px solid #334155; color: #94a3b8;
      border-radius: 10px; padding: 8px 14px; font-size: 13px; cursor: pointer;
    }
    .btn-primary {
      background: rgba(45,212,191,0.15); border: 1px solid rgba(45,212,191,0.35); color: #5eead4;
      border-radius: 10px; padding: 8px 14px; font-size: 13px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: default; }
  `]
})
export class RetoAdminValidacionComponent implements OnInit, OnChanges {
  @Input({ required: true }) competitionId!: number;
  @Output() openHistory = new EventEmitter<{ userId: number; fullName: string }>();

  private adminService = inject(AdminService);

  readonly allFlags: AdminReviewFlag[] = [
    'SUSPICIOUS', 'DUPLICATE', 'EXCESSIVE_DURATION', 'OUTSIDE_RULES', 'MISSING_EVIDENCE', 'INCONSISTENT_DATA',
  ];
  readonly filterOptions: { id: AdminReviewFlag | null; label: string }[] = [
    { id: null, label: 'Todas' },
    { id: 'SUSPICIOUS', label: 'Sospechosas' },
    { id: 'DUPLICATE', label: 'Duplicadas' },
    { id: 'EXCESSIVE_DURATION', label: 'Excesivamente largas' },
    { id: 'OUTSIDE_RULES', label: 'Fuera de las reglas' },
    { id: 'MISSING_EVIDENCE', label: 'Evidencia faltante' },
    { id: 'INCONSISTENT_DATA', label: 'Datos poco consistentes' },
  ];

  selectedFlag: AdminReviewFlag | null = null;
  items: AdminActivityReviewItem[] = [];
  loading = false;
  error = '';

  editing: AdminActivityReviewItem | null = null;
  draftFlags: AdminReviewFlag[] = [];
  draftNote = '';
  draftStatus: AdminReviewStatus = 'PENDING_REVIEW';
  saving = false;
  saveError = '';

  ngOnInit(): void {
    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competitionId'] && !changes['competitionId'].firstChange) {
      this.reload();
    }
  }

  selectFlag(flag: AdminReviewFlag | null): void {
    this.selectedFlag = flag;
    this.reload();
  }

  labelOf(flag: AdminReviewFlag): string {
    return ADMIN_REVIEW_FLAG_LABELS[flag] ?? flag;
  }

  openMark(item: AdminActivityReviewItem): void {
    this.editing = item;
    this.draftFlags = [...(item.adminFlags?.length ? item.adminFlags : item.suggestedFlags)];
    this.draftNote = item.adminNote ?? '';
    this.draftStatus = item.reviewStatus ?? 'PENDING_REVIEW';
    this.saveError = '';
  }

  cancelMark(): void {
    this.editing = null;
    this.saveError = '';
  }

  toggleFlag(flag: AdminReviewFlag): void {
    if (this.draftFlags.includes(flag)) {
      this.draftFlags = this.draftFlags.filter(f => f !== flag);
    } else {
      this.draftFlags = [...this.draftFlags, flag];
    }
  }

  saveMark(): void {
    if (!this.editing || !this.competitionId) return;
    this.saving = true;
    this.saveError = '';
    this.adminService.upsertActivityReview(this.competitionId, {
      source: this.editing.source,
      sourceId: this.editing.sourceId,
      flags: this.draftFlags,
      note: this.draftNote.trim() || null,
      status: this.draftStatus,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.editing = null;
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err?.error?.message || 'No se pudo guardar la revisión';
      }
    });
  }

  private reload(): void {
    if (!this.competitionId) return;
    this.loading = true;
    this.error = '';
    this.adminService.getActivityReviews(this.competitionId, this.selectedFlag).subscribe({
      next: (data) => {
        this.items = data.items ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo cargar la cola de revisión';
      }
    });
  }
}
