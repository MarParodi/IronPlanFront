import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRetoTeam, AdminService, AdminTeamBonus } from '../home/services/admin.service';
import { compressImageToJpeg, validateImageFile } from '../../core/utils/image-upload.util';

@Component({
  selector: 'app-reto-admin-bonos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-ip-secondary">Bonos manuales</h3>
          <p class="text-xs text-ip-muted mt-1">
            Puntos extra por actividades especiales del reto. Se suman al puntaje del equipo.
          </p>
        </div>
        <button type="button" class="btn-primary" [disabled]="!teamOptions.length" (click)="openCreate()">
          Agregar bono
        </button>
      </div>

      <p *ngIf="error" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</p>

      <div class="rounded-2xl border border-ip-border bg-ip-surface overflow-hidden">
        <div *ngIf="loading" class="px-4 py-10 text-center text-sm text-ip-muted">Cargando bonos...</div>
        <div class="overflow-x-auto" *ngIf="!loading">
          <table class="w-full text-sm text-left">
            <thead class="bg-ip-page text-ip-primary0 text-xs uppercase">
              <tr>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Equipo</th>
                <th class="px-4 py-3">Bono</th>
                <th class="px-4 py-3 text-right">Puntos</th>
                <th class="px-4 py-3">Prueba</th>
                <th class="px-4 py-3">Registrado por</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let b of items" class="hover:bg-slate-800/30">
                <td class="px-4 py-3 text-ip-muted whitespace-nowrap">{{ b.createdAt | date:'dd/MM HH:mm' }}</td>
                <td class="px-4 py-3 text-ip-primary">{{ b.groupName }}</td>
                <td class="px-4 py-3 text-ip-primary">{{ b.title }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-amber-300">+{{ b.points | number:'1.0-1' }}</td>
                <td class="px-4 py-3">
                  <a *ngIf="b.evidenceUrl" [href]="b.evidenceUrl" target="_blank" rel="noopener" class="text-xs text-teal-400 hover:underline">Ver</a>
                  <span *ngIf="!b.evidenceUrl" class="text-ip-muted">—</span>
                </td>
                <td class="px-4 py-3 text-ip-muted">{{ b.createdByName || '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="text-xs text-red-300 hover:underline" [disabled]="deletingId === b.id" (click)="remove(b)">
                    {{ deletingId === b.id ? 'Eliminando...' : 'Eliminar' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!items.length">
                <td colspan="7" class="px-4 py-6 text-center text-ip-muted">Aún no hay bonos manuales registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <div *ngIf="creating" class="modal-overlay" (click)="closeCreate()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Agregar bono manual</h2>
          <button type="button" class="modal-close" (click)="closeCreate()">×</button>
        </div>
        <div class="modal-body space-y-4">
          <label class="block text-xs text-ip-muted">
            Equipo
            <select [(ngModel)]="draftGroupId" class="member-select mt-1 w-full">
              <option *ngFor="let t of teamOptions" [ngValue]="t.groupId">
                {{ t.groupName }} ({{ t.score | number:'1.0-1' }} pts)
              </option>
            </select>
          </label>
          <label class="block text-xs text-ip-muted">
            Puntos
            <input type="number" min="1" step="1" [(ngModel)]="draftPoints"
              class="mt-1 w-full rounded-lg border border-ip-border bg-ip-page px-3 py-2 text-sm text-ip-primary">
          </label>
          <label class="block text-xs text-ip-muted">
            Título del bono
            <input type="text" maxlength="150" [(ngModel)]="draftTitle" placeholder="Ej. Foto grupal semanal"
              class="mt-1 w-full rounded-lg border border-ip-border bg-ip-page px-3 py-2 text-sm text-ip-primary">
          </label>
          <div class="space-y-2">
            <p class="text-xs text-ip-muted">Prueba (opcional)</p>
            <label class="inline-block text-xs px-3 py-1.5 rounded-lg border border-ip-border text-ip-primary cursor-pointer hover:border-teal-500/40">
              {{ draftFile ? 'Cambiar imagen' : 'Subir imagen' }}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/*" class="sr-only" (change)="onFileSelected($event)">
            </label>
            <div *ngIf="preview" class="relative">
              <img [src]="preview" alt="Prueba del bono" class="max-h-48 rounded-lg border border-ip-border">
              <button type="button" class="mt-1 text-xs text-ip-muted hover:text-red-300" (click)="clearFile()">Quitar imagen</button>
            </div>
            <p *ngIf="processingImage" class="text-xs text-ip-muted">Procesando imagen...</p>
          </div>
          <p *ngIf="saveError" class="text-sm text-red-300">{{ saveError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeCreate()">Cancelar</button>
          <button type="button" class="btn-primary" [disabled]="saving || processingImage" (click)="save()">
            {{ saving ? 'Guardando...' : 'Agregar bono' }}
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
export class RetoAdminBonosComponent implements OnInit, OnChanges {
  @Input({ required: true }) competitionId!: number;
  @Input() teams: AdminRetoTeam[] = [];
  @Output() changed = new EventEmitter<void>();

  private adminService = inject(AdminService);

  items: AdminTeamBonus[] = [];
  loading = false;
  error = '';
  deletingId: number | null = null;

  creating = false;
  draftGroupId: number | null = null;
  draftPoints: number | null = null;
  draftTitle = '';
  draftFile: File | null = null;
  preview: string | null = null;
  processingImage = false;
  saving = false;
  saveError = '';

  get teamOptions(): AdminRetoTeam[] {
    return this.teams.filter(t => t.groupId != null);
  }

  ngOnInit(): void {
    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competitionId'] && !changes['competitionId'].firstChange) {
      this.reload();
    }
  }

  openCreate(): void {
    this.creating = true;
    this.draftGroupId = this.teamOptions[0]?.groupId ?? null;
    this.draftPoints = null;
    this.draftTitle = '';
    this.clearFile();
    this.saveError = '';
  }

  closeCreate(): void {
    if (this.saving) return;
    this.creating = false;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      this.saveError = invalid;
      return;
    }
    this.saveError = '';
    this.processingImage = true;
    try {
      this.draftFile = await compressImageToJpeg(file);
      this.preview = URL.createObjectURL(this.draftFile);
    } catch (e: any) {
      this.clearFile();
      this.saveError = e?.message || 'No se pudo procesar la imagen.';
    } finally {
      this.processingImage = false;
    }
  }

  clearFile(): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.draftFile = null;
    this.preview = null;
  }

  save(): void {
    if (!this.competitionId) return;
    const title = this.draftTitle.trim();
    const points = Number(this.draftPoints);
    if (this.draftGroupId == null) {
      this.saveError = 'Selecciona un equipo.';
      return;
    }
    if (!Number.isFinite(points) || points <= 0) {
      this.saveError = 'Los puntos deben ser mayores a 0.';
      return;
    }
    if (!title) {
      this.saveError = 'El título del bono es obligatorio.';
      return;
    }

    this.saving = true;
    this.saveError = '';
    this.adminService.createTeamBonus(this.competitionId, {
      groupId: this.draftGroupId,
      points,
      title,
      file: this.draftFile,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.creating = false;
        this.clearFile();
        this.reload();
        this.changed.emit();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err?.error?.message || 'No se pudo guardar el bono';
      }
    });
  }

  remove(bonus: AdminTeamBonus): void {
    if (!confirm(`¿Eliminar el bono "${bonus.title}" (+${bonus.points} pts) de ${bonus.groupName}?`)) return;
    this.deletingId = bonus.id;
    this.error = '';
    this.adminService.deleteTeamBonus(this.competitionId, bonus.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.reload();
        this.changed.emit();
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'No se pudo eliminar el bono';
      }
    });
  }

  private reload(): void {
    if (!this.competitionId) return;
    this.loading = true;
    this.error = '';
    this.adminService.getTeamBonuses(this.competitionId).subscribe({
      next: (data) => {
        this.items = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudieron cargar los bonos';
      }
    });
  }
}
