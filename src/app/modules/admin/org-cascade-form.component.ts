import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../home/services/admin.service';
 
// ─── Interfaces ───────────────────────────────────────────────────────────────
 
export interface NodeForm {
  id?: number;          // si existe = editar, si no = crear
  name: string;
  children: NodeForm[];
  expanded: boolean;    // para colapsar/expandir en el UI
}
 
export interface OrgForm {
  id?: number;
  name: string;
  organizationKind: string;
  children: NodeForm[];
}
 
// ─── Config de tipos ──────────────────────────────────────────────────────────
 
export const ORG_KINDS = [
  { key: 'UNIVERSIDAD', icon: '🎓', label: 'Universidad',  sub: 'Facultad → Carrera → Grupo'     },
  { key: 'EMPRESA',     icon: '🏢', label: 'Empresa',      sub: 'Depto → Área → Equipo'           },
  { key: 'GIMNASIO',    icon: '🏋️', label: 'Gimnasio',     sub: 'Sucursal → Clase → Grupo'        },
  { key: 'INSTITUCION', icon: '🏛️', label: 'Institución',  sub: 'División → Programa → Sección'   },
];
 
export const KIND_LEVELS: Record<string, string[]> = {
  UNIVERSIDAD: ['Universidad', 'Facultad',     'Carrera',   'Grupo'   ],
  EMPRESA:     ['Empresa',     'Departamento', 'Área',      'Equipo'  ],
  GIMNASIO:    ['Gimnasio',    'Sucursal',     'Clase',     'Grupo'   ],
  INSTITUCION: ['Institución', 'División',     'Programa',  'Sección' ],
};
 
@Component({
  selector: 'app-org-cascade-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-overlay" (click)="onCancel()">
  <div class="modal" (click)="$event.stopPropagation()">
 
    <!-- Header -->
    <div class="modal-header">
      <h2>{{ form.id ? 'Editar organización' : 'Nueva organización' }}</h2>
      <button class="modal-close" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
 
    <!-- Body -->
    <div class="modal-body">
 
      <!-- Nombre raíz -->
      <div class="field">
        <label class="field-label">Nombre de la organización</label>
        <input
          [(ngModel)]="form.name"
          type="text"
          class="field-input"
          [placeholder]="getPlaceholder()"/>
      </div>
 
      <!-- Tipo de organización (solo al crear) -->
      <div class="field" *ngIf="!form.id">
        <label class="field-label">Tipo de organización</label>
        <div class="kind-grid">
          <button
            *ngFor="let k of orgKinds"
            class="kind-btn"
            [class.selected]="form.organizationKind === k.key"
            (click)="form.organizationKind = k.key">
            <span class="kind-icon">{{ k.icon }}</span>
            <span class="kind-name">{{ k.label }}</span>
            <span class="kind-sub">{{ k.sub }}</span>
          </button>
        </div>
      </div>
 
      <!-- Divider -->
      <div class="divider" *ngIf="form.organizationKind"></div>
 
      <!-- Subgrupos nivel 2 -->
      <ng-container *ngIf="form.organizationKind">
        <div class="level-section">
          <span class="level-label">{{ getLevelName(2) }}s</span>
 
          <div *ngFor="let l2 of form.children; let i2 = index" class="node-block level-2">
            <!-- Header nivel 2 -->
            <div class="node-header" (click)="l2.expanded = !l2.expanded">
              <div class="node-header-left">
                <svg class="node-chevron" [class.open]="l2.expanded"
                     width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
                <span class="node-title">{{ l2.name || '(sin nombre)' }}</span>
                <span class="node-badge">{{ getLevelName(2) }}</span>
              </div>
              <button class="node-remove" (click)="$event.stopPropagation(); removeNode(form.children, i2)" title="Eliminar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
 
            <!-- Body nivel 2 -->
            <div class="node-body" *ngIf="l2.expanded">
              <div class="field">
                <label class="field-label">Nombre del {{ getLevelName(2) | lowercase }}</label>
                <input [(ngModel)]="l2.name" type="text" class="field-input"
                       [placeholder]="'Ej: ' + getExample(2)"/>
              </div>
 
              <!-- Subgrupos nivel 3 -->
              <div class="sublevel" *ngIf="l2.children.length > 0 || true">
                <span class="level-label small">{{ getLevelName(3) }}s</span>
 
                <div *ngFor="let l3 of l2.children; let i3 = index" class="node-block level-3">
                  <div class="node-header" (click)="l3.expanded = !l3.expanded">
                    <div class="node-header-left">
                      <svg class="node-chevron" [class.open]="l3.expanded"
                           width="11" height="11" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                      <span class="node-title small">{{ l3.name || '(sin nombre)' }}</span>
                      <span class="node-badge small">{{ getLevelName(3) }}</span>
                    </div>
                    <button class="node-remove" (click)="$event.stopPropagation(); removeNode(l2.children, i3)" title="Eliminar">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
 
                  <!-- Body nivel 3 -->
                  <div class="node-body" *ngIf="l3.expanded">
                    <div class="field">
                      <label class="field-label">Nombre del {{ getLevelName(3) | lowercase }}</label>
                      <input [(ngModel)]="l3.name" type="text" class="field-input"
                             [placeholder]="'Ej: ' + getExample(3)"/>
                    </div>
 
                    <!-- Subgrupos nivel 4 -->
                    <div class="sublevel">
                      <span class="level-label small">{{ getLevelName(4) }}s</span>
 
                      <div *ngFor="let l4 of l3.children; let i4 = index" class="node-block level-4">
                        <div class="node-row">
                          <div class="field" style="flex:1">
                            <input [(ngModel)]="l4.name" type="text" class="field-input"
                                   [placeholder]="'Ej: ' + getExample(4)"/>
                          </div>
                          <span class="node-badge small" style="flex-shrink:0">{{ getLevelName(4) }}</span>
                          <button class="node-remove" (click)="removeNode(l3.children, i4)" title="Eliminar">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
 
                      <button class="add-btn" (click)="addNode(l3.children)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        Agregar {{ getLevelName(4) }}
                      </button>
                    </div>
                  </div>
                </div>
 
                <button class="add-btn" (click)="addNode(l2.children)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Agregar {{ getLevelName(3) }}
                </button>
              </div>
            </div>
          </div>
 
          <button class="add-btn primary-add" (click)="addNode(form.children)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Agregar {{ getLevelName(2) }}
          </button>
        </div>
      </ng-container>
 
      <!-- Error -->
      <p *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</p>
 
    </div>
 
    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn-secondary" (click)="onCancel()" [disabled]="saving">Cancelar</button>
      <button class="btn-primary" (click)="onSave()" [disabled]="saving">
        {{ saving ? 'Guardando...' : (form.id ? 'Guardar cambios' : 'Crear organización') }}
      </button>
    </div>
 
  </div>
</div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: #171a1d; border: 1px solid rgba(255,255,255,0.09);
      border-radius: 18px; width: 100%; max-width: 520px;
      max-height: 88vh; display: flex; flex-direction: column;
      box-shadow: 0 25px 60px rgba(0,0,0,0.7);
    }
    .modal-header {
      padding: 18px 20px 0; display: flex;
      align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .modal-header h2 { font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0; }
    .modal-close {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: 7px; background: transparent; border: none; color: #64748b; cursor: pointer;
    }
    .modal-close:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
 
    .modal-body {
      padding: 16px 20px; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: 14px;
    }
 
    .modal-footer {
      padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;
    }
 
    /* Fields */
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .field-input {
      background: #0f1214; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #e2e8f0; padding: 8px 11px; font-size: 13px; outline: none;
    }
    .field-input:focus { border-color: rgba(45,212,191,0.5); }
    .field-input::placeholder { color: #334155; }
 
    /* Kind grid */
    .kind-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .kind-btn {
      padding: 10px 8px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: #1b1f23; cursor: pointer; text-align: center;
      transition: all 0.15s; display: flex; flex-direction: column; gap: 2px;
    }
    .kind-btn:hover { border-color: rgba(255,255,255,0.15); }
    .kind-btn.selected { border-color: #2dd4bf; background: rgba(45,212,191,0.08); }
    .kind-icon { font-size: 22px; }
    .kind-name { font-size: 12px; font-weight: 600; color: #e2e8f0; }
    .kind-sub { font-size: 10px; color: #64748b; }
 
    /* Divider */
    .divider { height: 1px; background: rgba(255,255,255,0.06); }
 
    /* Level section */
    .level-section { display: flex; flex-direction: column; gap: 8px; }
    .level-label {
      font-size: 11px; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .level-label.small { font-size: 10px; }
 
    /* Node blocks */
    .node-block {
      border-radius: 9px; overflow: hidden;
    }
    .level-2 { border: 1px solid rgba(255,255,255,0.08); background: #1b1f23; }
    .level-3 { border: 1px solid rgba(255,255,255,0.05); background: #1e2226; }
    .level-4 { background: transparent; }
 
    .node-header {
      padding: 9px 12px; display: flex; align-items: center;
      justify-content: space-between; cursor: pointer;
    }
    .node-header:hover { background: rgba(255,255,255,0.025); }
    .node-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
 
    .node-chevron { color: #475569; transition: transform 0.2s; flex-shrink: 0; }
    .node-chevron.open { transform: rotate(90deg); }
 
    .node-title {
      font-size: 13px; color: #e2e8f0; flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .node-title.small { font-size: 12px; color: #cbd5e1; }
 
    .node-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 5px;
      background: rgba(45,212,191,0.12); color: #2dd4bf;
      font-weight: 500; flex-shrink: 0;
    }
    .node-badge.small { font-size: 9px; padding: 1px 5px; }
 
    .node-remove {
      width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
      border-radius: 5px; background: transparent;
      border: 1px solid rgba(255,255,255,0.07); color: #475569; cursor: pointer;
      flex-shrink: 0; margin-left: 6px; transition: all 0.15s;
    }
    .node-remove:hover { background: rgba(239,68,68,0.12); color: #fca5a5; border-color: rgba(239,68,68,0.3); }
 
    .node-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
 
    .node-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; }
 
    .sublevel { display: flex; flex-direction: column; gap: 6px; }
 
    /* Add button */
    .add-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 10px; border-radius: 8px;
      border: 1px dashed rgba(255,255,255,0.12);
      background: transparent; cursor: pointer;
      font-size: 12px; color: #64748b; width: 100%; transition: all 0.15s;
    }
    .add-btn:hover { border-color: #2dd4bf; color: #2dd4bf; }
    .primary-add { border-color: rgba(45,212,191,0.25); color: #2dd4bf; }
 
    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 9px;
      background: linear-gradient(to bottom, #5eead4, #2dd4bf);
      color: #0f172a; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer; transition: filter 0.15s;
    }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
 
    .btn-secondary {
      padding: 8px 16px; border-radius: 9px;
      background: rgba(255,255,255,0.05); color: #cbd5e1;
      font-size: 13px; font-weight: 500;
      border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.09); }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
 
    .error-msg {
      font-size: 12px; color: #fca5a5;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px; padding: 8px 12px;
    }
  `]
})
export class OrgCascadeFormComponent implements OnInit {
 
  @Input() editId?: number; // si viene = modo edición
  @Output() saved    = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
 
  orgKinds = ORG_KINDS;
  saving = false;
  errorMsg = '';
 
  form: OrgForm = {
    name: '',
    organizationKind: '',
    children: []
  };
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void {
    if (this.editId) {
      this.loadForEdit(this.editId);
    }
  }
 
  // ─── Cargar datos para edición ────────────────────────────────────────────
 
  loadForEdit(id: number) {
    this.adminService.getOrganizationCascade(id).subscribe({
      next: (data) => {
        this.form = {
          id: data.id,
          name: data.name,
          organizationKind: data.organizationKind ?? '',
          children: this.mapNodeToForm(data.children ?? [])
        };
      },
      error: () => { this.errorMsg = 'Error cargando la organización'; }
    });
  }
 
  private mapNodeToForm(nodes: any[]): NodeForm[] {
    return nodes.map(n => ({
      id: n.id,
      name: n.name,
      expanded: true,
      children: this.mapNodeToForm(n.children ?? [])
    }));
  }
 
  // ─── Guardar ──────────────────────────────────────────────────────────────
 
  onSave() {
    this.errorMsg = '';
 
    if (!this.form.name.trim()) {
      this.errorMsg = 'El nombre de la organización es obligatorio'; return;
    }
    if (!this.form.id && !this.form.organizationKind) {
      this.errorMsg = 'Selecciona el tipo de organización'; return;
    }
 
    this.saving = true;
    const payload = this.buildPayload();
 
    const req = this.form.id
      ? this.adminService.updateOrganizationCascade(this.form.id, payload)
      : this.adminService.createOrganizationCascade(payload);
 
    req.subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.message || 'Error al guardar';
      }
    });
  }
 
  private buildPayload() {
    return {
      name: this.form.name.trim(),
      organizationKind: this.form.organizationKind || undefined,
      children: this.buildChildren(this.form.children)
    };
  }
 
  private buildChildren(nodes: NodeForm[]): any[] {
    return nodes
      .filter(n => n.name.trim())
      .map(n => ({
        id: n.id,
        name: n.name.trim(),
        children: this.buildChildren(n.children)
      }));
  }
 
  onCancel() { this.cancelled.emit(); }
 
  // ─── Manipulación de nodos ────────────────────────────────────────────────
 
  addNode(list: NodeForm[]) {
    list.push({ name: '', children: [], expanded: true });
  }
 
  removeNode(list: NodeForm[], index: number) {
    list.splice(index, 1);
  }
 
  // ─── Helpers de UI ────────────────────────────────────────────────────────
 
  getLevelName(level: 1 | 2 | 3 | 4): string {
    const levels = KIND_LEVELS[this.form.organizationKind];
    if (!levels) return `Nivel ${level}`;
    return levels[level - 1];
  }
 
  getPlaceholder(): string {
    const kind = ORG_KINDS.find(k => k.key === this.form.organizationKind);
    if (!kind) return 'Ej: Mi Organización';
    const examples: Record<string, string> = {
      UNIVERSIDAD: 'Ej: Universidad Autónoma de Sinaloa',
      EMPRESA:     'Ej: AgriCol S.A de C.V',
      GIMNASIO:    'Ej: Iron Gym',
      INSTITUCION: 'Ej: Cruz Roja Mexicana',
    };
    return examples[kind.key] ?? 'Ej: Mi Organización';
  }
 
  getExample(level: 2 | 3 | 4): string {
    const examples: Record<string, string[]> = {
      UNIVERSIDAD: ['', 'Facultad de Ingeniería', 'Ing. en Software', 'Grupo 01'],
      EMPRESA:     ['', 'Recursos Humanos',       'Reclutamiento',   'Equipo A'],
      GIMNASIO:    ['', 'Sucursal Centro',         'Crossfit AM',     'Grupo 1' ],
      INSTITUCION: ['', 'División Norte',          'Programa Salud',  'Sección 1'],
    };
    const kind = this.form.organizationKind;
    return examples[kind]?.[level] ?? '';
  }
}