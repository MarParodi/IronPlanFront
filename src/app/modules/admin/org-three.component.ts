import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
 
// ─── Interfaces ───────────────────────────────────────────────────────────────
 
export interface GroupTreeNode {
  id: number;
  name: string;
  code: string;
  groupType: 'EMPRESA' | 'FACULTAD' | 'CARRERA' | 'GRUPO';
  organizationKind?: 'UNIVERSIDAD' | 'EMPRESA' | 'GIMNASIO' | 'INSTITUCION';
  active: boolean;
  totalMembers: number;
  totalChildren: number;
  children: GroupTreeNode[];
}
 
// ─── Config de jerarquía por kind ────────────────────────────────────────────
 
export const ORG_HIERARCHY: Record<string, {
  icon: string; color: string; bgColor: string;
  level1: string; level2: string; level3: string; level4: string;
}> = {
  UNIVERSIDAD: {
    icon: 'graduation',
    color: '#2dd4bf', bgColor: 'rgba(45,212,191,0.12)',
    level1: 'Universidad', level2: 'Facultad', level3: 'Carrera', level4: 'Grupo'
  },
  EMPRESA: {
    icon: 'building',
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)',
    level1: 'Empresa', level2: 'Departamento', level3: 'Área', level4: 'Equipo'
  },
  GIMNASIO: {
    icon: 'gym',
    color: '#f87171', bgColor: 'rgba(248,113,113,0.15)',
    level1: 'Gimnasio', level2: 'Sucursal', level3: 'Clase', level4: 'Grupo'
  },
  INSTITUCION: {
    icon: 'institution',
    color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)',
    level1: 'Institución', level2: 'División', level3: 'Programa', level4: 'Sección'
  },
};
 
// ─── Componente ───────────────────────────────────────────────────────────────
 
@Component({
  selector: 'app-org-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-root">
      <div *ngFor="let root of nodes" class="org-card" [class.inactive]="!root.active">
 
        <!-- Header raíz -->
        <div class="org-card-header" (click)="toggle(root.id)">
          <div class="org-icon" [style.background]="getConfig(root).bgColor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 [attr.stroke]="getConfig(root).color" stroke-width="2">
              <ng-container [ngSwitch]="getIconType(root)">
                <ng-container *ngSwitchCase="'graduation'">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </ng-container>
                <ng-container *ngSwitchCase="'building'">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </ng-container>
                <ng-container *ngSwitchCase="'gym'">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                </ng-container>
              </ng-container>
            </svg>
          </div>
 
          <div class="org-info">
            <div class="org-name">{{ root.name }}</div>
            <div class="org-meta">{{ root.code }} · {{ getConfig(root).level1 }}</div>
          </div>
 
          <div class="org-badge"
               [style.background]="getConfig(root).bgColor"
               [style.color]="getConfig(root).color">
            {{ getConfig(root).level1 }}
          </div>
 
          <div class="status-dot" [class.dot-active]="root.active" [class.dot-inactive]="!root.active"></div>
 
          <svg class="chevron" [class.open]="isOpen(root.id)"
               width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
 
        <!-- Stats raíz -->
        <div class="org-stats">
          <div class="stat">
            {{ getLevelName(root, 2) }}:
            <span>{{ countByLevel(root.children, 'FACULTAD') }}</span>
          </div>
          <div class="stat">
            {{ getLevelName(root, 4) }}:
            <span>{{ countLeafs(root) }}</span>
          </div>
          <div class="stat">
            Miembros: <span>{{ root.totalMembers }}</span>
          </div>
        </div>
 
        <!-- Hijos nivel 2 -->
        <div class="children" *ngIf="isOpen(root.id)">
          <div *ngFor="let l2 of root.children" class="child-card" [class.inactive]="!l2.active">
 
            <div class="child-header" (click)="toggle(l2.id)">
              <div class="child-icon" style="background:rgba(139,92,246,0.15);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="#a78bfa" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <span class="child-name">{{ l2.name }}</span>
              <span class="child-count">{{ l2.totalMembers }} miembros</span>
              <div class="child-badge" style="background:rgba(139,92,246,0.15);color:#c4b5fd;">
                {{ getLevelName(root, 2) }}
              </div>
              <div class="child-actions" *ngIf="canManage">
                <button class="btn-tree-icon" (click)="$event.stopPropagation(); onEdit.emit(l2)" title="Editar">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
              <svg class="chevron-sm" [class.open]="isOpen(l2.id)"
                   width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
 
            <!-- Hijos nivel 3 -->
            <div class="grandchildren" *ngIf="isOpen(l2.id)">
              <div *ngFor="let l3 of l2.children" class="level3-block">
 
                <div class="level3-header" (click)="toggle(l3.id)">
                  <div class="level3-dot" style="background:#378add;"></div>
                  <span class="level3-name">{{ l3.name }}</span>
                  <span class="level3-badge" style="background:rgba(59,130,246,0.15);color:#93c5fd;">
                    {{ getLevelName(root, 3) }}
                  </span>
                  <div class="child-actions" *ngIf="canManage">
                    <button class="btn-tree-icon" (click)="$event.stopPropagation(); onEdit.emit(l3)" title="Editar">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                  </div>
                  <svg class="chevron-sm" [class.open]="isOpen(l3.id)"
                       width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
 
                <!-- Hijos nivel 4 (hojas) -->
                <div class="leaves" *ngIf="isOpen(l3.id)">
                  <div *ngFor="let l4 of l3.children" class="leaf-row">
                    <div class="leaf-dot"
                         [style.background]="l4.active ? '#2dd4bf' : '#475569'"></div>
                    <span class="leaf-name">{{ l4.name }}</span>
                    <span class="leaf-code">{{ l4.code }}</span>
                    <span class="leaf-members">{{ l4.totalMembers }} miembros</span>
                    <span class="leaf-status" [class.badge-active]="l4.active" [class.badge-inactive]="!l4.active">
                      {{ l4.active ? 'Activo' : 'Inactivo' }}
                    </span>
                    <div class="child-actions" *ngIf="canManage">
                      <button class="btn-tree-icon" (click)="onEdit.emit(l4)" title="Editar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button class="btn-tree-icon btn-danger" (click)="onDeactivate.emit(l4)"
                              *ngIf="l4.active" title="Desactivar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
 
                  <div *ngIf="l3.children.length === 0" class="leaf-empty">
                    Sin {{ getLevelName(root, 4).toLowerCase() }}s aún
                  </div>
                </div>
 
              </div>
 
              <div *ngIf="l2.children.length === 0" class="leaf-empty">
                Sin {{ getLevelName(root, 3).toLowerCase() }}s aún
              </div>
            </div>
 
          </div>
 
          <div *ngIf="root.children.length === 0" class="leaf-empty" style="padding:16px;">
            Sin {{ getLevelName(root, 2).toLowerCase() }}s aún
          </div>
        </div>
 
        <!-- Acciones raíz -->
        <div class="org-footer" *ngIf="canManage">
          <button class="btn-tree-sm" (click)="onEdit.emit(root)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Editar
          </button>
          <button class="btn-tree-sm btn-danger-sm" (click)="onDeactivate.emit(root)" *ngIf="root.active">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
            Desactivar
          </button>
        </div>
 
      </div>
 
      <div *ngIf="nodes.length === 0" class="empty-tree">
        <p>No hay organizaciones creadas aún.</p>
      </div>
    </div>
  `,
  styles: [`
    .tree-root { display: flex; flex-direction: column; gap: 14px; }
 
    .org-card {
      background: #171a1d;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; overflow: hidden;
      transition: border-color 0.2s;
    }
    .org-card:hover { border-color: rgba(255,255,255,0.14); }
    .org-card.inactive { opacity: 0.55; }
 
    .org-card-header {
      padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
      cursor: pointer;
    }
    .org-card-header:hover { background: rgba(255,255,255,0.025); }
 
    .org-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .org-info { flex: 1; min-width: 0; }
    .org-name { font-size: 14px; font-weight: 600; color: #f1f5f9;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .org-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
 
    .org-badge {
      font-size: 10px; font-weight: 600; padding: 3px 8px;
      border-radius: 6px; text-transform: uppercase;
      letter-spacing: 0.4px; flex-shrink: 0;
    }
 
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-active { background: #34d399; }
    .dot-inactive { background: #475569; }
 
    .chevron { color: #475569; transition: transform 0.2s; flex-shrink: 0; }
    .chevron.open { transform: rotate(90deg); }
    .chevron-sm { color: #475569; transition: transform 0.2s; flex-shrink: 0; }
    .chevron-sm.open { transform: rotate(90deg); }
 
    .org-stats {
      display: flex; gap: 16px; padding: 0 16px 12px 70px;
    }
    .stat { font-size: 11px; color: #475569; }
    .stat span { color: #94a3b8; font-weight: 500; }
 
    .children {
      border-top: 1px solid rgba(255,255,255,0.05);
      padding: 10px 12px 12px;
      display: flex; flex-direction: column; gap: 6px;
    }
 
    .child-card {
      background: #1b1f23;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; overflow: hidden;
    }
    .child-card.inactive { opacity: 0.55; }
 
    .child-header {
      padding: 10px 12px; display: flex; align-items: center;
      gap: 8px; cursor: pointer;
    }
    .child-header:hover { background: rgba(255,255,255,0.025); }
 
    .child-icon {
      width: 28px; height: 28px; border-radius: 7px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .child-name { font-size: 13px; font-weight: 500; color: #e2e8f0; flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .child-count { font-size: 11px; color: #475569; flex-shrink: 0; }
    .child-badge {
      font-size: 10px; font-weight: 600; padding: 2px 7px;
      border-radius: 5px; text-transform: uppercase; flex-shrink: 0;
    }
 
    .grandchildren {
      border-top: 1px solid rgba(255,255,255,0.04);
      padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;
    }
 
    .level3-block { margin-bottom: 2px; }
 
    .level3-header {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 8px; border-radius: 7px; cursor: pointer;
    }
    .level3-header:hover { background: rgba(255,255,255,0.03); }
    .level3-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .level3-name { font-size: 12px; color: #cbd5e1; flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .level3-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px;
      font-weight: 500; flex-shrink: 0;
    }
 
    .leaves {
      padding: 4px 0 4px 14px;
      display: flex; flex-direction: column; gap: 2px;
      border-left: 2px solid rgba(255,255,255,0.05);
      margin-left: 11px;
    }
 
    .leaf-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 6px;
    }
    .leaf-row:hover { background: rgba(255,255,255,0.025); }
    .leaf-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .leaf-name { font-size: 12px; color: #94a3b8; flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .leaf-code { font-size: 10px; color: #334155; font-family: monospace; flex-shrink: 0; }
    .leaf-members { font-size: 11px; color: #475569; flex-shrink: 0; }
    .leaf-status {
      font-size: 10px; font-weight: 600; padding: 2px 6px;
      border-radius: 4px; flex-shrink: 0;
    }
    .badge-active { background: rgba(16,185,129,0.15); color: #34d399; }
    .badge-inactive { background: rgba(100,116,139,0.15); color: #64748b; }
 
    .leaf-empty {
      font-size: 12px; color: #334155; padding: 8px;
      font-style: italic;
    }
 
    .child-actions {
      display: flex; gap: 4px; flex-shrink: 0;
    }
 
    .btn-tree-icon {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; background: transparent;
      border: 1px solid rgba(255,255,255,0.07);
      color: #64748b; cursor: pointer; transition: all 0.15s;
    }
    .btn-tree-icon:hover { background: rgba(255,255,255,0.07); color: #94a3b8; }
    .btn-tree-icon.btn-danger:hover { background: rgba(239,68,68,0.12); color: #fca5a5; border-color: rgba(239,68,68,0.25); }
 
    .org-footer {
      border-top: 1px solid rgba(255,255,255,0.05);
      padding: 10px 14px; display: flex; gap: 8px;
    }
 
    .btn-tree-sm {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px; border-radius: 7px; font-size: 12px; font-weight: 500;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      color: #94a3b8; cursor: pointer; transition: all 0.15s;
    }
    .btn-tree-sm:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.12); color: #fca5a5; border-color: rgba(239,68,68,0.25); }
 
    .empty-tree {
      display: flex; align-items: center; justify-content: center;
      padding: 48px; color: #475569; font-size: 14px;
    }
  `]
})
export class OrgTreeComponent {
  @Input() nodes: GroupTreeNode[] = [];
  @Input() canManage = false;
  @Output() onEdit       = new EventEmitter<GroupTreeNode>();
  @Output() onDeactivate = new EventEmitter<GroupTreeNode>();
 
  private openIds = new Set<number>();
 
  toggle(id: number) {
    if (this.openIds.has(id)) this.openIds.delete(id);
    else this.openIds.add(id);
  }
 
  isOpen(id: number): boolean { return this.openIds.has(id); }
 
  getConfig(node: GroupTreeNode) {
    const kind = node.organizationKind ?? 'UNIVERSIDAD';
    return ORG_HIERARCHY[kind] ?? ORG_HIERARCHY['UNIVERSIDAD'];
  }
 
  getIconType(node: GroupTreeNode): string {
    return this.getConfig(node).icon;
  }
 
  getLevelName(root: GroupTreeNode, level: 2 | 3 | 4): string {
    const cfg = this.getConfig(root);
    if (level === 2) return cfg.level2;
    if (level === 3) return cfg.level3;
    return cfg.level4;
  }
 
  countByLevel(children: GroupTreeNode[], _type: string): number {
    return children.length;
  }
 
  countLeafs(node: GroupTreeNode): number {
    let count = 0;
    const walk = (n: GroupTreeNode) => {
      if (n.children.length === 0) { count++; return; }
      n.children.forEach(walk);
    };
    node.children.forEach(walk);
    return count;
  }
}