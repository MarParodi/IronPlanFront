import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../home/services/admin.service';
 
interface ScopeNode {
  id: number;
  name: string;
  groupType: string;
  isLeaf: boolean;
  memberCount: number;
  children: ScopeNode[];
}
 
interface BreadcrumbItem {
  id: number;
  name: string;
}
 
@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-overlay" (click)="onCancel()">
  <div class="modal" (click)="$event.stopPropagation()">
 
    <div class="modal-header">
      <h2>Generar código de invitación</h2>
      <button class="modal-close" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
 
    <div class="modal-body">
 
      <!-- ─── PASO 1: Seleccionar grupo destino ─── -->
      <div class="step-block">
        <div class="step-label">
          <span class="step-num">1</span>
          <span>Selecciona el grupo destino</span>
        </div>
 
        <!-- Org raíz -->
        <div class="field" *ngIf="rootOrgs.length > 0">
          <label class="field-label">Organización</label>
          <div class="org-list">
            <div *ngFor="let org of rootOrgs"
                 class="org-item"
                 [class.selected]="selectedRoot?.id === org.id"
                 (click)="selectRoot(org)">
              <div class="org-item-left">
                <div class="org-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                </div>
                <span class="org-name">{{ org.name }}</span>
              </div>
              <svg *ngIf="selectedRoot?.id === org.id" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="#2dd4bf" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>
 
        <!-- Navegador jerárquico -->
        <div class="field" *ngIf="selectedRoot">
          <label class="field-label">Navega hasta el grupo específico</label>
 
          <!-- Breadcrumb -->
          <div class="breadcrumb" *ngIf="breadcrumb.length > 0">
            <span class="bc-root" (click)="resetNavigation()">{{ selectedRoot.name }}</span>
            <ng-container *ngFor="let bc of breadcrumb; let last = last">
              <span class="bc-sep">›</span>
              <span class="bc-item" [class.bc-active]="last"
                    (click)="!last ? navigateTo(bc) : null">
                {{ bc.name }}
              </span>
            </ng-container>
          </div>
 
          <!-- Hint -->
          <div class="nav-hint" *ngIf="!selectedGroupId">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>
              Haz clic en un grupo para seleccionarlo como destino.
              Si tiene subgrupos, usa la flecha para bajar un nivel.
            </span>
          </div>
 
          <!-- Nodos -->
          <div class="node-list" *ngIf="!loadingNodes">
            <div *ngFor="let node of currentNodes"
                 class="node-item"
                 [class.node-selected]="selectedGroupId === node.id">
 
              <div class="node-left" (click)="selectGroup(node)">
                <!-- Ícono hoja vs intermedio -->
                <div class="node-icon" [class.node-icon-leaf]="node.isLeaf">
                  <svg *ngIf="node.isLeaf" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <svg *ngIf="!node.isLeaf" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                </div>
                <span class="node-name">{{ node.name }}</span>
              </div>
 
              <div class="node-right">
                <span *ngIf="node.isLeaf && node.memberCount > 0" class="node-count">
                  {{ node.memberCount }} miembros
                </span>
                <span class="node-badge">{{ getNodeLabel(node.groupType) }}</span>
                <button *ngIf="!node.isLeaf" type="button" class="node-drill"
                        (click)="drillDown(node); $event.stopPropagation()"
                        title="Ver subgrupos">
                  <svg class="node-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                <svg *ngIf="node.isLeaf && selectedGroupId === node.id"
                     width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="#2dd4bf" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
 
            <div *ngIf="currentNodes.length === 0 && !loadingNodes" class="empty-nodes">
              <span>No hay subgrupos en este nivel.</span>
              <button *ngIf="currentLevelGroup" type="button" class="btn-use-level"
                      (click)="selectGroup(currentLevelGroup)">
                Usar «{{ currentLevelGroup.name }}» como destino
              </button>
            </div>
          </div>
 
          <div class="loading-nodes" *ngIf="loadingNodes">
            <div class="spinner-sm"></div>
            <span>Cargando...</span>
          </div>
        </div>
 
        <!-- Ruta seleccionada -->
        <div class="selected-path" *ngIf="selectedGroupId">
          <div class="path-label">Grupo destino</div>
          <div class="path-value">
            <div class="path-route">
              <span class="path-root">{{ selectedRoot?.name }}</span>
              <ng-container *ngFor="let bc of breadcrumb">
                <span class="path-sep">›</span>
                <span class="path-node">{{ bc.name }}</span>
              </ng-container>
            </div>
            <div class="path-group">
              <div class="path-group-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <span class="path-group-name">{{ selectedGroupName }}</span>
            </div>
          </div>
          <button class="btn-change" (click)="clearSelection()">Cambiar</button>
        </div>
      </div>
 
      <div class="divider"></div>
 
      <!-- ─── PASO 2: Opciones del código ─── -->
      <div class="step-block">
        <div class="step-label">
          <span class="step-num">2</span>
          <span>Opciones del código</span>
        </div>
 
        <div class="field">
          <label class="field-label">
            Código personalizado
            <span class="field-hint">— déjalo vacío para generarlo automáticamente</span>
          </label>
          <div class="code-input-wrap">
            <input [(ngModel)]="form.code" type="text" class="field-input code-input"
                   placeholder="Ej: ING-SW-2026"
                   (input)="form.code = form.code.toUpperCase()"/>
            <div class="auto-badge" *ngIf="!form.code">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Auto
            </div>
          </div>
        </div>
 
        <div class="field">
          <label class="field-label">Rol al unirse con este código</label>
          <select [(ngModel)]="form.membershipRole" class="field-input">
            <option value="MEMBER">Miembro (solo consulta)</option>
            <option value="ADMIN">Administrador (gestión del grupo)</option>
          </select>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label">
              Máx. usos
              <span class="field-hint">— vacío = ilimitado</span>
            </label>
            <input [(ngModel)]="form.maxUses" type="number" min="1" class="field-input"
                   placeholder="∞"/>
          </div>
          <div class="field">
            <label class="field-label">
              Expira el
              <span class="field-hint">— vacío = sin límite</span>
            </label>
            <input [(ngModel)]="form.expiresAt" type="date" class="field-input"/>
          </div>
        </div>
      </div>
 
      <!-- ─── Preview del resultado (después de guardar) ─── -->
      <div class="code-result" *ngIf="generatedCode">
        <div class="result-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Código generado</span>
        </div>
        <div class="code-display">
          <span class="code-big">{{ generatedCode }}</span>
          <button class="btn-copy" (click)="copyCode(generatedCode)" title="Copiar código">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            {{ copied ? '¡Copiado!' : 'Copiar' }}
          </button>
        </div>
        <div class="code-meta">
          <span>→ {{ selectedGroupName }}</span>
          <span *ngIf="form.maxUses">· Máx {{ form.maxUses }} usos</span>
          <span *ngIf="form.expiresAt">· Expira {{ form.expiresAt | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>
 
      <p *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</p>
 
    </div>
 
    <div class="modal-footer">
      <button class="btn-secondary" (click)="onCancel()" [disabled]="saving">
        {{ generatedCode ? 'Cerrar' : 'Cancelar' }}
      </button>
      <button *ngIf="!generatedCode" class="btn-primary" (click)="onSave()" [disabled]="saving || !selectedGroupId">
        {{ saving ? 'Generando...' : 'Generar código' }}
      </button>
      <button *ngIf="generatedCode" class="btn-primary" (click)="onSaveAnother()">
        + Generar otro
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
      background: rgb(var(--ip-surface)); border: 1px solid var(--ip-card-border-color);
      border-radius: 18px; width: 100%; max-width: 500px;
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
 
    /* Steps */
    .step-block { display: flex; flex-direction: column; gap: 10px; }
    .step-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 600; color: #94a3b8;
    }
    .step-num {
      width: 20px; height: 20px; border-radius: 50%;
      background: rgba(45,212,191,0.15); border: 1px solid rgba(45,212,191,0.3);
      color: #2dd4bf; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
 
    .divider { height: 1px; background: rgba(255,255,255,0.06); }
 
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .field-hint { font-size: 11px; color: #475569; font-weight: 400; }
    .field-input {
      background: #0f1214; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #e2e8f0; padding: 8px 11px; font-size: 13px; outline: none;
    }
    .field-input:focus { border-color: rgba(45,212,191,0.5); }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
 
    /* Code input */
    .code-input-wrap { position: relative; }
    .code-input { padding-right: 60px; font-family: monospace; letter-spacing: 1px; }
    .auto-badge {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; color: #2dd4bf; background: rgba(45,212,191,0.1);
      border: 1px solid rgba(45,212,191,0.2); border-radius: 5px; padding: 2px 7px;
    }
 
    /* Org list */
    .org-list { display: flex; flex-direction: column; gap: 5px; }
    .org-item {
      padding: 8px 12px; border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.08); background: #1b1f23;
      cursor: pointer; display: flex; align-items: center; justify-content: space-between;
      transition: all 0.15s;
    }
    .org-item:hover { border-color: rgba(255,255,255,0.15); }
    .org-item.selected { border-color: #2dd4bf; background: rgba(45,212,191,0.08); }
    .org-item-left { display: flex; align-items: center; gap: 8px; }
    .org-icon {
      width: 26px; height: 26px; border-radius: 7px;
      background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;
      color: #64748b;
    }
    .org-name { font-size: 13px; color: #e2e8f0; }
 
    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 10px; background: #0f1214; border-radius: 8px;
      font-size: 12px; flex-wrap: wrap;
    }
    .bc-root { color: #2dd4bf; cursor: pointer; font-weight: 500; }
    .bc-root:hover { text-decoration: underline; }
    .bc-sep { color: #334155; }
    .bc-item { color: #94a3b8; cursor: pointer; }
    .bc-item:hover { color: #e2e8f0; }
    .bc-item.bc-active { color: #f1f5f9; font-weight: 500; cursor: default; }
 
    /* Nav hint */
    .nav-hint {
      display: flex; align-items: flex-start; gap: 7px;
      font-size: 12px; color: #64748b; padding: 7px 10px;
      background: rgba(255,255,255,0.03); border-radius: 7px;
      border: 1px solid rgba(255,255,255,0.05);
    }
 
    /* Nodes */
    .node-list { display: flex; flex-direction: column; gap: 4px; }
    .node-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      border: 1px solid transparent; transition: all 0.15s;
    }
    .node-item:hover { background: rgba(255,255,255,0.04); }
    .node-item.node-selected { background: rgba(45,212,191,0.07); border-color: rgba(45,212,191,0.25); }
 
    .node-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .node-icon {
      width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
      background: rgba(255,255,255,0.05); display: flex; align-items: center;
      justify-content: center; color: #475569;
    }
    .node-icon.node-icon-leaf { background: rgba(45,212,191,0.1); color: #2dd4bf; }
    .node-name {
      font-size: 13px; color: #e2e8f0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .node-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .node-count { font-size: 11px; color: #475569; }
    .node-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 5px;
      background: rgba(45,212,191,0.12); color: #0d9488; font-weight: 500;
    }
    .node-drill {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 6px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer; padding: 0;
    }
    .node-drill:hover { background: rgba(255,255,255,0.1); border-color: rgba(45,212,191,0.35); }
    .node-arrow { color: #475569; }
    .node-drill:hover .node-arrow { color: #2dd4bf; }
 
    .empty-nodes {
      display: flex; flex-direction: column; gap: 8px;
      font-size: 12px; color: #64748b; padding: 10px;
      background: rgba(255,255,255,0.03); border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .btn-use-level {
      align-self: flex-start; font-size: 12px; font-weight: 500;
      color: #2dd4bf; background: rgba(45,212,191,0.1);
      border: 1px solid rgba(45,212,191,0.3); border-radius: 7px;
      padding: 6px 12px; cursor: pointer;
    }
    .btn-use-level:hover { background: rgba(45,212,191,0.18); }
    .loading-nodes {
      display: flex; align-items: center; gap: 8px;
      padding: 10px; font-size: 12px; color: #64748b;
    }
    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(45,212,191,0.2);
      border-top-color: #2dd4bf; border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
 
    /* Selected path */
    .selected-path {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      background: rgba(45,212,191,0.06); border: 1px solid rgba(45,212,191,0.2);
    }
    .path-label { font-size: 10px; color: #0d9488; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .path-value { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
    .path-route {
      display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
      font-size: 11px; color: #64748b;
    }
    .path-root { color: #94a3b8; }
    .path-sep { color: #334155; }
    .path-node { color: #94a3b8; }
    .path-group { display: flex; align-items: center; gap: 6px; }
    .path-group-icon {
      width: 20px; height: 20px; border-radius: 5px;
      background: rgba(45,212,191,0.15); display: flex; align-items: center;
      justify-content: center; color: #2dd4bf; flex-shrink: 0;
    }
    .path-group-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .btn-change {
      font-size: 11px; color: #64748b; background: transparent;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
      padding: 4px 9px; cursor: pointer; white-space: nowrap; flex-shrink: 0;
    }
    .btn-change:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
 
    /* Code result */
    .code-result {
      display: flex; flex-direction: column; gap: 8px; padding: 14px;
      background: rgba(45,212,191,0.05); border: 1px solid rgba(45,212,191,0.25);
      border-radius: 12px;
    }
    .result-header {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #2dd4bf; font-weight: 600;
    }
    .code-display { display: flex; align-items: center; gap: 10px; }
    .code-big {
      font-family: monospace; font-size: 22px; font-weight: 700;
      color: #f8fafc; letter-spacing: 3px; flex: 1;
    }
    .btn-copy {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 500;
      background: rgba(45,212,191,0.12); border: 1px solid rgba(45,212,191,0.3);
      color: #2dd4bf; cursor: pointer; white-space: nowrap; transition: all 0.15s;
    }
    .btn-copy:hover { background: rgba(45,212,191,0.2); }
    .code-meta {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      font-size: 11px; color: #64748b;
    }
 
    /* Buttons */
    .btn-primary {
      padding: 8px 16px; border-radius: 9px;
      background: linear-gradient(to bottom, #5eead4, #2dd4bf);
      color: #0f172a; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer;
    }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      padding: 8px 16px; border-radius: 9px;
      background: rgba(255,255,255,0.05); color: #cbd5e1;
      font-size: 13px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    }
    .error-msg {
      font-size: 12px; color: #fca5a5;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px; padding: 8px 12px;
    }
  `]
})
export class InvitationFormComponent implements OnInit {
 
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
 
  // ─── Navegación ──────────────────────────────────────────────────────────
  rootOrgs: ScopeNode[]        = [];
  selectedRoot?: ScopeNode;
  currentNodes: ScopeNode[]    = [];
  breadcrumb: BreadcrumbItem[] = [];
  loadingNodes                 = false;
 
  // Grupo destino seleccionado
  selectedGroupId?: number;
  selectedGroupName = '';
  /** Nivel actual de navegación (último breadcrumb o raíz) */
  currentLevelGroup?: ScopeNode;
 
  // ─── Formulario ──────────────────────────────────────────────────────────
  form = {
    code: '',
    maxUses: null as number | null,
    expiresAt: '',
    membershipRole: 'MEMBER' as 'MEMBER' | 'ADMIN'
  };
 
  saving        = false;
  errorMsg      = '';
  generatedCode = '';
  copied        = false;
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void { this.loadRootOrgs(); }
 
  // ─── Carga orgs raíz ─────────────────────────────────────────────────────
 
  loadRootOrgs() {
    this.adminService.getGroups({ type: 'EMPRESA', active: 'true' }).subscribe({
      next: (data) => {
        this.rootOrgs = data.map((g: any) => ({
          id: g.id, name: g.name, groupType: g.groupType,
          isLeaf: false, memberCount: 0, children: []
        }));
      }
    });
  }
 
  // ─── Navegación ──────────────────────────────────────────────────────────
 
  selectRoot(org: ScopeNode) {
    this.selectedRoot    = org;
    this.breadcrumb      = [];
    this.currentLevelGroup = org;
    this.selectGroup(org);
    this.loadChildren(org.id);
  }
 
  resetNavigation() {
    if (!this.selectedRoot) return;
    this.breadcrumb        = [];
    this.currentLevelGroup = this.selectedRoot;
    this.selectGroup(this.selectedRoot);
    this.loadChildren(this.selectedRoot.id);
  }
 
  navigateTo(bc: BreadcrumbItem) {
    const idx       = this.breadcrumb.findIndex(b => b.id === bc.id);
    this.breadcrumb = this.breadcrumb.slice(0, idx + 1);
    const node: ScopeNode = { id: bc.id, name: bc.name, groupType: '', isLeaf: false, memberCount: 0, children: [] };
    this.currentLevelGroup = node;
    this.selectGroup(node);
    this.loadChildren(bc.id);
  }
 
  loadChildren(groupId: number) {
  this.loadingNodes = true;
  this.adminService.getScopeChildren(groupId).subscribe({
    next: (data) => {
      this.currentNodes = data.map((n: any) => ({
        id: n.id,
        name: n.name,
        groupType: n.groupType,
        memberCount: n.memberCount ?? 0,
        children: n.children ?? [],
        isLeaf: !!(n.isLeaf ?? n.leaf)
      }));
      this.loadingNodes = false;
    },
    error: () => { this.loadingNodes = false; }
  });
}
 
  selectGroup(node: ScopeNode) {
    this.selectedGroupId   = node.id;
    this.selectedGroupName = node.name;
    this.errorMsg = '';
  }

  drillDown(node: ScopeNode) {
    this.breadcrumb.push({ id: node.id, name: node.name });
    this.currentLevelGroup = node;
    this.selectGroup(node);
    this.loadChildren(node.id);
  }
 
  clearSelection() {
    this.selectedGroupId   = undefined;
    this.selectedGroupName = '';
  }
 
  // ─── Guardar ─────────────────────────────────────────────────────────────
 
  onSave() {
    this.errorMsg = '';
 
    if (!this.selectedGroupId) {
      this.errorMsg = 'Selecciona un grupo destino'; return;
    }
 
    this.saving = true;
 
    const payload: any = {
      organizationalGroupId: this.selectedGroupId,
      code:     this.form.code.trim() || undefined,
      maxUses:  this.form.maxUses     || undefined,
      membershipRole: this.form.membershipRole,
      expiresAt: this.form.expiresAt  || undefined,
    };
 
    this.adminService.createInvitation(payload).subscribe({
      next: (res: any) => {
        this.saving        = false;
        this.generatedCode = res.code;
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving   = false;
        this.errorMsg = err?.error?.message || 'Error al generar el código';
      }
    });
  }
 
  onSaveAnother() {
    this.generatedCode     = '';
    this.selectedGroupId   = undefined;
    this.selectedGroupName = '';
    this.breadcrumb        = [];
    this.currentLevelGroup = this.selectedRoot;
    this.form              = { code: '', maxUses: null, expiresAt: '', membershipRole: 'MEMBER' };
    this.errorMsg          = '';
    this.copied            = false;
    if (this.selectedRoot) this.loadChildren(this.selectedRoot.id);
  }
 
  onCancel() { this.cancelled.emit(); }
 
  // ─── Helpers ─────────────────────────────────────────────────────────────
 
  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    });
  }
 
  getNodeLabel(groupType: string): string {
    const labels: Record<string, string> = {
      EMPRESA: 'Organización', FACULTAD: 'Facultad',
      CARRERA: 'Carrera', GRUPO: 'Grupo',
    };
    return labels[groupType] ?? groupType;
  }
}