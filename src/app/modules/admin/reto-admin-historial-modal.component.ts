import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ADMIN_REVIEW_FLAG_LABELS,
  AdminPointHistory,
  AdminPointHistoryEntry,
  AdminReviewFlag,
} from '../home/services/admin.service';

@Component({
  selector: 'app-reto-admin-historial-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <p class="text-[11px] uppercase tracking-wide text-ip-muted mb-1">Vista administrativa</p>
            <h2>Historial de {{ history?.fullName || fallbackName }}</h2>
          </div>
          <button type="button" class="modal-close" (click)="close.emit()" aria-label="Cerrar">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div *ngIf="loading" class="modal-loading">
          <div class="spinner"></div>
          <p>Cargando historial...</p>
        </div>

        <p *ngIf="error" class="mx-5 mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</p>

        <div *ngIf="!loading && history as h" class="modal-body">
          <div *ngIf="!h.days.length" class="py-10 text-center text-sm text-ip-muted">
            Este participante aún no tiene actividades en el reto.
          </div>

          <section *ngFor="let day of h.days" class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-ip-muted">{{ day.label }}</h3>
            <button type="button" *ngFor="let entry of day.entries"
              class="w-full text-left rounded-xl border border-ip-border bg-ip-page/60 px-3 py-2.5 hover:border-teal-500/30 transition"
              (click)="toggle(entry)">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm text-ip-primary font-medium truncate">
                    {{ lineLabel(entry) }}
                  </p>
                  <p class="text-xs text-ip-muted mt-0.5">{{ statusLabel(entry.validationStatus) }}</p>
                </div>
                <p class="text-sm font-semibold tabular-nums shrink-0"
                  [class.text-teal-300]="entry.points > 0"
                  [class.text-ip-muted]="entry.points <= 0">
                  {{ entry.points > 0 ? '+' : '' }}{{ entry.points | number:'1.0-1' }} pts
                </p>
              </div>

              <div *ngIf="isOpen(entry)" class="mt-3 pt-3 border-t border-ip-border space-y-1.5 text-xs text-ip-muted">
                <p><span class="text-ip-secondary">Tipo:</span> {{ entry.activityLabel }}</p>
                <p *ngIf="entry.durationMinutes != null"><span class="text-ip-secondary">Duración:</span> {{ entry.durationMinutes }} min</p>
                <p *ngIf="entry.occurredAt"><span class="text-ip-secondary">Fecha y hora:</span> {{ entry.occurredAt | date:'dd/MM/yyyy HH:mm' }}</p>
                <p><span class="text-ip-secondary">Puntos otorgados:</span> {{ entry.points | number:'1.0-1' }}</p>
                <p><span class="text-ip-secondary">Regla aplicada:</span> {{ entry.ruleApplied }}</p>
                <p><span class="text-ip-secondary">Fuente de datos:</span> {{ entry.dataSource }}</p>
                <p><span class="text-ip-secondary">Estado de validación:</span> {{ statusLabel(entry.validationStatus) }}</p>
                <p *ngIf="flagList(entry).length">
                  <span class="text-ip-secondary">Marcas admin:</span>
                  {{ flagLabels(flagList(entry)) }}
                </p>
                <p *ngIf="entry.adminNote"><span class="text-ip-secondary">Nota:</span> {{ entry.adminNote }}</p>
                <a *ngIf="entry.evidenceUrl" [href]="entry.evidenceUrl" target="_blank" rel="noopener"
                  class="inline-flex mt-1 text-teal-400 hover:underline" (click)="$event.stopPropagation()">
                  Ver evidencia
                </a>
                <img *ngIf="entry.evidenceUrl" [src]="entry.evidenceUrl" alt="Evidencia"
                  class="mt-2 max-h-40 rounded-lg object-cover border border-ip-border">
              </div>
            </button>
          </section>
        </div>

        <div class="modal-footer" *ngIf="!loading && history">
          <div>
            <p class="text-[11px] uppercase tracking-wide text-ip-muted">Total acumulado del reto</p>
            <p class="text-lg font-bold tabular-nums text-teal-300">{{ history.totalPoints | number:'1.0-1' }} pts</p>
          </div>
          <button type="button" class="btn-secondary" (click)="close.emit()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: rgb(var(--ip-surface)); border: 1px solid var(--ip-card-border-color);
      border-radius: 20px; width: 100%; max-width: 560px;
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 30px 80px rgba(0,0,0,0.8);
    }
    .modal-header {
      padding: 18px 20px 12px; display: flex;
      align-items: flex-start; justify-content: space-between;
      flex-shrink: 0; gap: 12px;
    }
    .modal-header h2 { font-size: 17px; font-weight: 700; color: #f8fafc; margin: 0; }
    .modal-close {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: 7px; background: transparent; border: none; color: #64748b;
      cursor: pointer; flex-shrink: 0;
    }
    .modal-close:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
    .modal-loading {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 60px; color: #64748b; font-size: 14px;
    }
    .spinner {
      width: 32px; height: 32px; border: 2px solid rgba(45,212,191,0.2);
      border-top-color: #2dd4bf; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-body {
      padding: 8px 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
    }
    .modal-footer {
      padding: 12px 20px 16px; border-top: 1px solid #1e293b;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .btn-secondary {
      background: transparent; border: 1px solid #334155; color: #94a3b8;
      border-radius: 10px; padding: 8px 14px; font-size: 13px; cursor: pointer;
    }
    .btn-secondary:hover { border-color: #64748b; color: #e2e8f0; }
  `]
})
export class RetoAdminHistorialModalComponent {
  @Input() history: AdminPointHistory | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() fallbackName = '';
  @Output() close = new EventEmitter<void>();

  private openKey: string | null = null;

  toggle(entry: AdminPointHistoryEntry): void {
    const key = this.keyOf(entry);
    this.openKey = this.openKey === key ? null : key;
  }

  isOpen(entry: AdminPointHistoryEntry): boolean {
    return this.openKey === this.keyOf(entry);
  }

  lineLabel(entry: AdminPointHistoryEntry): string {
    if (entry.kind === 'ACTIVITY' && entry.durationMinutes != null) {
      return `${entry.activityLabel} · ${entry.durationMinutes} min`;
    }
    return entry.activityLabel;
  }

  statusLabel(status: string): string {
    if (status === 'PUNTUADA') return 'Puntuada';
    if (status === 'NO_PUNTUA') return 'No puntúa';
    if (status === 'EN_REVISION') return 'En revisión';
    return status || 'Sin estado';
  }

  flagLabels(flags: AdminReviewFlag[]): string {
    return (flags ?? []).map(f => ADMIN_REVIEW_FLAG_LABELS[f] ?? f).join(', ');
  }

  flagList(entry: AdminPointHistoryEntry): AdminReviewFlag[] {
    return entry.adminFlags ?? [];
  }

  private keyOf(entry: AdminPointHistoryEntry): string {
    return `${entry.kind}-${entry.source ?? ''}-${entry.sourceId ?? entry.occurredAt}-${entry.activityType}`;
  }
}
