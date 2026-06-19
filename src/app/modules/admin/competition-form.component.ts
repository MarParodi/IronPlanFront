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
  groupType: string;
  parentId?: number;
}
 
interface Participant {
  id: number;
  name: string;
  groupType: string;
}
 
@Component({
  selector: 'app-competition-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-overlay" (click)="onCancel()">
  <div class="modal" (click)="$event.stopPropagation()">
 
    <div class="modal-header">
      <h2>Nueva competencia</h2>
      <button class="modal-close" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
 
    <div class="modal-body">
 
      <div class="field">
        <label class="field-label">Nombre de la competencia</label>
        <input [(ngModel)]="form.name" type="text" class="field-input"
               placeholder="Ej: Reto Febrero — Ing. Mochis"/>
      </div>
 
      <div class="row2">
        <div class="field">
          <label class="field-label">Tipo</label>
          <select [(ngModel)]="form.competitionType" class="field-input" (ngModelChange)="onTypeChange()">
            <option value="">Selecciona</option>
            <option value="RANKING">Ranking</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="VERSUS">Versus</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Métrica</label>
          <select [(ngModel)]="form.metricType" class="field-input">
            <option value="">Selecciona</option>
            <option value="SESSIONS">Sesiones</option>
            <option value="ACTIVE_MINUTES">Minutos activos</option>
            <option value="WORKOUTS_COUNT">Entrenamientos</option>
          </select>
        </div>
      </div>
 
      <div class="row2">
        <div class="field">
          <label class="field-label">Fecha inicio</label>
          <input [(ngModel)]="form.startDate" type="date" class="field-input"/>
        </div>
        <div class="field">
          <label class="field-label">
            Fecha fin <span class="hint">(vacío = permanente)</span>
          </label>
          <input [(ngModel)]="form.endDate" type="date" class="field-input"/>
        </div>
      </div>
 
      <div class="divider"></div>
      <span class="section-title">Participantes</span>

      <div class="field" *ngIf="selectedRoot && !isMemberCompetition">
        <label class="field-label">Modo de participación</label>
        <div class="mode-toggle">
          <button type="button"
            class="mode-btn"
            [class.active]="form.participantMode === 'GROUP'"
            (click)="form.participantMode = 'GROUP'">
            Grupos
          </button>
          <button type="button"
            class="mode-btn"
            [class.active]="form.participantMode === 'ORGANIZATION_MEMBERS'"
            (click)="form.participantMode = 'ORGANIZATION_MEMBERS'">
            Miembros org.
          </button>
        </div>
        <p class="hint mt-1" *ngIf="form.participantMode === 'GROUP'">
          Ranking entre grupos seleccionados.
        </p>
        <p class="hint mt-1" *ngIf="form.participantMode === 'ORGANIZATION_MEMBERS'">
          Ranking individual de todos los miembros de la organización.
        </p>
      </div>
 
      <!-- Tipo hint -->
      <div class="type-hint" *ngIf="form.competitionType">
        <span *ngIf="form.competitionType === 'VERSUS'" class="type-badge versus">
          VERSUS — selecciona exactamente 2 participantes del mismo nivel
        </span>
        <span *ngIf="form.competitionType === 'RANKING'" class="type-badge ranking">
          RANKING — selecciona 2 o más del mismo nivel
        </span>
        <span *ngIf="form.competitionType === 'CHALLENGE'" class="type-badge challenge">
          CHALLENGE — selecciona 2 o más del mismo nivel (requiere fecha fin)
        </span>
      </div>
 
      <!-- Organización raíz -->
      <div class="field" *ngIf="rootOrgs.length > 0">
        <label class="field-label">Organización</label>
        <div class="org-list">
          <div *ngFor="let org of rootOrgs"
               class="org-item"
               [class.selected]="selectedRoot?.id === org.id"
               (click)="selectRoot(org)">
            <span class="org-name">{{ org.name }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 *ngIf="selectedRoot?.id === org.id">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
 
      <!-- Navegación jerárquica -->
      <div class="field" *ngIf="selectedRoot">
        <label class="field-label">Navega y elige el nivel que compite</label>
 
        <!-- Breadcrumb -->
        <div class="breadcrumb" *ngIf="breadcrumb.length > 0">
          <span class="bc-root" (click)="resetNavigation()">{{ selectedRoot.name }}</span>
          <ng-container *ngFor="let bc of breadcrumb; let last = last">
            <span class="bc-sep">›</span>
            <span class="bc-item" [class.bc-active]="last"
                  (click)="!last ? navigateTo(bc, $event) : null">
              {{ bc.name }}
            </span>
          </ng-container>
        </div>
 
        <!-- Hint contextual -->
        <div class="nav-hint" *ngIf="!isMemberLevel && currentNodes.length > 0">
          <span *ngIf="!hasLeafNodes()">
            Haz clic en
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            para bajar un nivel, o
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            para seleccionar como participante
          </span>
          <span *ngIf="hasLeafNodes()">
            ✓ Selecciona los <strong>{{ currentLevelLabel() }}</strong> que participan,
            o usa
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                 stroke="#2dd4bf" stroke-width="2" style="display:inline;vertical-align:middle">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            para ver miembros individuales
          </span>
        </div>
        <div class="nav-hint member-hint" *ngIf="isMemberLevel">
          Selecciona los miembros que participan
          <span *ngIf="form.competitionType === 'VERSUS'">(exactamente 2)</span>
          <span *ngIf="form.competitionType !== 'VERSUS'">(mínimo 2)</span>
        </div>
 
        <!-- Nodos -->
        <div class="node-list" *ngIf="!loadingNodes">
          <div *ngFor="let node of currentNodes"
               class="node-item"
               [class.node-selected]="isParticipantSelected(node.id)"
               [class.node-disabled]="isNodeDisabled(node)">
 
            <div class="node-left" (click)="handleCheckboxClick(node)">
              <div class="node-check" [class.checked]="isParticipantSelected(node.id)">
                <svg *ngIf="isParticipantSelected(node.id)"
                     width="10" height="10" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span class="node-name">{{ node.name }}</span>
            </div>
 
            <div class="node-right">
              <span *ngIf="node.isLeaf && node.memberCount > 0" class="node-count">
                {{ node.memberCount }} miembros
              </span>
              <span class="node-badge">{{ getNodeLabel(node.groupType) }}</span>
 
              <!-- Botón ver miembros (solo en nodos hoja) -->
              <button *ngIf="node.isLeaf && !isMemberLevel"
                      class="btn-members"
                      (click)="$event.stopPropagation(); goToMembers(node)"
                      title="Ver miembros individuales">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </button>
 
              <!-- Flecha para bajar nivel (solo en nodos no hoja) -->
              <button *ngIf="!node.isLeaf"
                      class="btn-drill"
                      (click)="$event.stopPropagation(); drillDown(node)"
                      title="Ver subgrupos">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
 
          <div *ngIf="currentNodes.length === 0" class="empty-nodes">
            No hay subgrupos en este nivel
          </div>
        </div>
 
        <div class="loading-nodes" *ngIf="loadingNodes">
          <div class="spinner-sm"></div>
          <span>Cargando...</span>
        </div>
      </div>
 
      <!-- ─── VISUALIZACIÓN VERSUS ─────────────────────────────── -->
      <div class="versus-preview" *ngIf="form.competitionType === 'VERSUS' && selectedParticipants.length > 0">
        <div class="versus-side" [class.side-ready]="selectedParticipants.length >= 1">
          <div class="versus-avatar" *ngIf="selectedParticipants[0]">
            {{ getInitials(selectedParticipants[0].name) }}
          </div>
          <div class="versus-empty-avatar" *ngIf="!selectedParticipants[0]">?</div>
          <span class="versus-name">{{ selectedParticipants[0].name || '—' }}</span>
          <span class="versus-type-label" *ngIf="selectedParticipants[0]">
            {{ getNodeLabel(selectedParticipants[0].groupType) }}
          </span>
        </div>
 
        <div class="versus-center">
          <div class="vs-badge">VS</div>
        </div>
 
        <div class="versus-side" [class.side-ready]="selectedParticipants.length >= 2">
          <div class="versus-avatar" *ngIf="selectedParticipants[1]" style="background: rgba(251,146,60,0.15); color: #fb923c; border-color: rgba(251,146,60,0.3)">
            {{ getInitials(selectedParticipants[1].name) }}
          </div>
          <div class="versus-empty-avatar" *ngIf="!selectedParticipants[1]">?</div>
          <span class="versus-name">{{ selectedParticipants[1].name || '—' }}</span>
          <span class="versus-type-label" *ngIf="selectedParticipants[1]">
            {{ getNodeLabel(selectedParticipants[1].groupType) }}
          </span>
        </div>
      </div>
 
      <!-- ─── RESUMEN RANKING / CHALLENGE ─────────────────────── -->
      <div class="field" *ngIf="form.competitionType !== 'VERSUS' && selectedParticipants.length > 0">
        <div class="participants-header">
          <label class="field-label">
            {{ isMemberCompetition ? 'Miembros seleccionados' : 'Grupos seleccionados' }}
          </label>
          <span class="participants-count">{{ selectedParticipants.length }} seleccionados</span>
        </div>
        <div class="participants-list">
          <div *ngFor="let p of selectedParticipants" class="participant-chip">
            <span>{{ p.name }}</span>
            <button class="chip-remove" (click)="removeParticipant(p.id)">×</button>
          </div>
        </div>
      </div>
 
      <p *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</p>
 
    </div>
 
    <div class="modal-footer">
      <button class="btn-secondary" (click)="onCancel()" [disabled]="saving">Cancelar</button>
      <button class="btn-primary" (click)="onSave()" [disabled]="saving">
        {{ saving ? 'Creando...' : 'Crear competencia' }}
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
 
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .hint { font-size: 11px; color: #475569; font-weight: 400; }
    .field-input {
      background: #0f1214; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #e2e8f0; padding: 8px 11px; font-size: 13px; outline: none;
    }
    .field-input:focus { border-color: rgba(45,212,191,0.5); }
    .field-input option { background: #1b1f23; }
 
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .divider { height: 1px; background: rgba(255,255,255,0.06); }
    .section-title {
      font-size: 11px; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .mode-toggle {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    }
    .mode-btn {
      padding: 9px 12px; border-radius: 9px; font-size: 12px; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
      color: #94a3b8; cursor: pointer; transition: all 0.15s;
    }
    .mode-btn.active {
      background: rgba(45,212,191,0.12); border-color: rgba(45,212,191,0.35); color: #2dd4bf;
    }
    .hint { font-size: 11px; color: #64748b; }
    .mt-1 { margin-top: 4px; }
 
    /* Type hints */
    .type-hint { display: flex; }
    .type-badge {
      font-size: 11px; padding: 5px 10px; border-radius: 7px; font-weight: 500;
    }
    .type-badge.versus {
      background: rgba(251,146,60,0.1); color: #fb923c;
      border: 1px solid rgba(251,146,60,0.2);
    }
    .type-badge.ranking {
      background: rgba(45,212,191,0.08); color: #2dd4bf;
      border: 1px solid rgba(45,212,191,0.2);
    }
    .type-badge.challenge {
      background: rgba(139,92,246,0.1); color: #a78bfa;
      border: 1px solid rgba(139,92,246,0.2);
    }
 
    /* Orgs */
    .org-list { display: flex; flex-direction: column; gap: 5px; }
    .org-item {
      padding: 9px 12px; border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.08); background: #1b1f23;
      cursor: pointer; display: flex; align-items: center; justify-content: space-between;
      transition: all 0.15s;
    }
    .org-item:hover { border-color: rgba(255,255,255,0.15); }
    .org-item.selected { border-color: #2dd4bf; background: rgba(45,212,191,0.08); }
    .org-name { font-size: 13px; color: #e2e8f0; }
 
    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 10px; background: #0f1214; border-radius: 8px;
      font-size: 12px; flex-wrap: wrap; margin-bottom: 6px;
    }
    .bc-root { color: #2dd4bf; cursor: pointer; font-weight: 500; }
    .bc-root:hover { text-decoration: underline; }
    .bc-sep { color: #334155; }
    .bc-item { color: #94a3b8; cursor: pointer; }
    .bc-item:hover { color: #e2e8f0; }
    .bc-item.bc-active { color: #f1f5f9; font-weight: 500; cursor: default; }
 
    /* Nav hints */
    .nav-hint {
      font-size: 12px; color: #64748b; padding: 7px 10px;
      background: rgba(255,255,255,0.03); border-radius: 7px;
      border: 1px solid rgba(255,255,255,0.05); margin-bottom: 4px;
    }
    .member-hint { color: #2dd4bf; border-color: rgba(45,212,191,0.2); background: rgba(45,212,191,0.05); }
 
    /* Nodes */
    .node-list { display: flex; flex-direction: column; gap: 4px; }
    .node-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px; border-radius: 8px;
      border: 1px solid transparent; transition: all 0.15s;
    }
    .node-item:hover { background: rgba(255,255,255,0.04); }
    .node-item.node-selected { background: rgba(45,212,191,0.07); border-color: rgba(45,212,191,0.25); }
    .node-item.node-disabled { opacity: 0.4; pointer-events: none; }
 
    .node-left {
      display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
      cursor: pointer;
    }
    .node-check {
      width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
      border: 1.5px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
    }
    .node-check.checked { background: #2dd4bf; border-color: #2dd4bf; color: #0f172a; }
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
 
    .btn-members, .btn-drill {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; background: rgba(45,212,191,0.1);
      border: 1px solid rgba(45,212,191,0.25); color: #2dd4bf;
      cursor: pointer; transition: all 0.15s; flex-shrink: 0;
    }
    .btn-members:hover, .btn-drill:hover { background: rgba(45,212,191,0.2); }
    .btn-drill { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); color: #94a3b8; }
    .btn-drill:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
 
    .empty-nodes { font-size: 12px; color: #334155; padding: 8px; font-style: italic; }
 
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
 
    /* ─── VERSUS PREVIEW ──────────────────────── */
    .versus-preview {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; padding: 14px 12px;
      background: linear-gradient(135deg, rgba(251,146,60,0.05) 0%, rgba(45,212,191,0.05) 100%);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
    }
    .versus-side {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      flex: 1; min-width: 0;
    }
    .versus-avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(45,212,191,0.15); color: #2dd4bf;
      border: 1.5px solid rgba(45,212,191,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; letter-spacing: -0.5px;
    }
    .versus-empty-avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1.5px dashed rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #334155;
    }
    .versus-name {
      font-size: 12px; font-weight: 600; color: #e2e8f0;
      text-align: center; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; max-width: 100%;
    }
    .versus-type-label {
      font-size: 10px; color: #475569; text-align: center;
    }
    .versus-center {
      display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
    }
    .vs-badge {
      width: 36px; height: 36px; border-radius: 50%;
      background: #0f1214; border: 1.5px solid rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; color: #94a3b8;
      letter-spacing: 0.5px;
    }
 
    /* Participants ranking */
    .participants-header { display: flex; align-items: center; justify-content: space-between; }
    .participants-count { font-size: 12px; color: #2dd4bf; font-weight: 500; }
    .participants-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .participant-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      background: rgba(45,212,191,0.12); border: 1px solid rgba(45,212,191,0.25);
      font-size: 12px; color: #2dd4bf;
    }
    .chip-remove {
      background: transparent; border: none; color: #0d9488;
      cursor: pointer; font-size: 14px; line-height: 1; padding: 0;
    }
    .chip-remove:hover { color: #f87171; }
 
    /* Buttons */
    .btn-primary {
      padding: 8px 16px; border-radius: 9px;
      background: linear-gradient(to bottom, #5eead4, #2dd4bf);
      color: #0f172a; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer;
    }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: 8px 16px; border-radius: 9px;
      background: rgba(255,255,255,0.05); color: #cbd5e1;
      font-size: 13px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
 
    .error-msg {
      font-size: 12px; color: #fca5a5;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px; padding: 8px 12px;
    }
  `]
})
export class CompetitionFormComponent implements OnInit {
 
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
 
  form = {
    name: '',
    competitionType: '',
    metricType: '',
    startDate: '',
    endDate: '',
    participantMode: 'GROUP' as 'GROUP' | 'ORGANIZATION_MEMBERS',
  };
 
  saving   = false;
  errorMsg = '';
 
  rootOrgs: ScopeNode[]        = [];
  selectedRoot?: ScopeNode;
  currentNodes: ScopeNode[]    = [];
  breadcrumb: BreadcrumbItem[] = [];
  loadingNodes     = false;
  isMemberLevel    = false;
 
  /** Nodo organizacional anfitrión del reto (padre de los participantes visibles). */
  currentParentId?: number;
  /** Tipo del nodo anfitrión: CARRERA, FACULTAD, etc. (no el tipo de cada participante). */
  currentScopeLevel = 'EMPRESA';

  selectedParticipants: Participant[] = [];
  isMemberCompetition = false;
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void { this.loadRootOrgs(); }
 
  // ─── Carga ────────────────────────────────────────────────────────────────
 
  loadRootOrgs() {
    this.adminService.getGroups({ type: 'EMPRESA', active: 'true' }).subscribe({
      next: (data) => {
        this.rootOrgs = data.map(g => ({
          id: g.id, name: g.name, groupType: g.groupType,
          isLeaf: false, memberCount: 0, children: []
        }));
      }
    });
  }
 
  // ─── Cambio de tipo ───────────────────────────────────────────────────────
 
  onTypeChange() {
    // Si cambia el tipo, limpiar selección para evitar inconsistencias
    this.selectedParticipants = [];
  }
 
  // ─── Navegación ───────────────────────────────────────────────────────────
 
  selectRoot(org: ScopeNode) {
    this.selectedRoot         = org;
    this.breadcrumb           = [];
    this.selectedParticipants = [];
    this.isMemberLevel        = false;
    this.isMemberCompetition  = false;
    this.currentParentId      = org.id;
    this.currentScopeLevel    = org.groupType;
    this.loadChildren(org.id);
  }

  resetNavigation() {
    if (!this.selectedRoot) return;
    this.breadcrumb           = [];
    this.isMemberLevel        = false;
    this.isMemberCompetition  = false;
    this.selectedParticipants = [];
    this.currentParentId      = this.selectedRoot.id;
    this.currentScopeLevel    = this.selectedRoot.groupType;
    this.loadChildren(this.selectedRoot.id);
  }

  navigateTo(bc: BreadcrumbItem, event?: Event) {
    const idx          = this.breadcrumb.findIndex(b => b.id === bc.id);
    this.breadcrumb    = this.breadcrumb.slice(0, idx + 1);
    this.isMemberLevel = false;
    this.isMemberCompetition = false;
    this.selectedParticipants = [];
    this.currentParentId   = bc.id;
    this.currentScopeLevel = bc.groupType;
    this.loadChildren(bc.id);
  }
 
  loadChildren(groupId: number) {
  this.loadingNodes = true;
  this.adminService.getScopeChildren(groupId).subscribe({
    next: (data) => {
      this.currentNodes = data.map((n: any) => ({
        ...n,
        isLeaf: n.isLeaf ?? n.leaf
      }));
      this.loadingNodes = false;
    },
    error: () => { this.loadingNodes = false; }
  });
}
 
  loadMembers(groupId: number) {
    this.loadingNodes        = true;
    this.isMemberLevel       = true;
    this.isMemberCompetition = true;
    this.adminService.getGroupMembers(groupId).subscribe({
      next: (data) => { this.currentNodes = data; this.loadingNodes = false; },
      error: () => { this.loadingNodes = false; }
    });
  }
 
  // ─── Bajar un nivel (flecha →) sin seleccionar ────────────────────────────
 
  drillDown(node: ScopeNode) {
    this.selectedParticipants = [];
    this.isMemberCompetition  = false;
    this.isMemberLevel        = false;
    this.currentParentId      = node.id;
    this.currentScopeLevel    = node.groupType;
    this.breadcrumb.push({
      id: node.id,
      name: node.name,
      groupType: node.groupType,
      parentId: this.currentParentId
    });
    this.loadChildren(node.id);
  }

  goToMembers(node: ScopeNode) {
    this.selectedParticipants = [];
    this.isMemberCompetition  = true;
    this.currentParentId      = node.id;
    this.currentScopeLevel    = 'GRUPO';
    this.breadcrumb.push({ id: node.id, name: node.name, groupType: 'GRUPO' });
    this.loadMembers(node.id);
  }
 
  // ─── Checkbox (seleccionar/deseleccionar participante) ────────────────────
 
  handleCheckboxClick(node: ScopeNode) {
    const alreadySelected = this.isParticipantSelected(node.id);
 
    if (alreadySelected) {
      this.removeParticipant(node.id);
      return;
    }
 
    // VERSUS: máximo 2
    if (this.form.competitionType === 'VERSUS' && this.selectedParticipants.length >= 2) {
      this.errorMsg = 'VERSUS solo permite 2 participantes. Quita uno primero.';
      return;
    }
 
    this.errorMsg = '';
    this.selectedParticipants.push({ id: node.id, name: node.name, groupType: node.groupType });
  }
 
  isParticipantSelected(id: number): boolean {
    return this.selectedParticipants.some(p => p.id === id);
  }
 
  // Un nodo está deshabilitado si ya hay 2 en VERSUS y no está seleccionado
  isNodeDisabled(node: ScopeNode): boolean {
    if (this.form.competitionType !== 'VERSUS') return false;
    return this.selectedParticipants.length >= 2 && !this.isParticipantSelected(node.id);
  }
 
  removeParticipant(id: number) {
    this.selectedParticipants = this.selectedParticipants.filter(p => p.id !== id);
    this.errorMsg = '';
  }
 
  // ─── Guardar ──────────────────────────────────────────────────────────────
 
  onSave() {
    this.errorMsg = '';
 
    if (!this.form.name.trim())        { this.errorMsg = 'El nombre es obligatorio'; return; }
    if (!this.form.competitionType)    { this.errorMsg = 'Selecciona el tipo'; return; }
    if (!this.form.metricType)         { this.errorMsg = 'Selecciona la métrica'; return; }
    if (!this.form.startDate)          { this.errorMsg = 'La fecha de inicio es obligatoria'; return; }
    if (this.form.competitionType === 'CHALLENGE' && !this.form.endDate) {
      this.errorMsg = 'CHALLENGE requiere fecha de fin'; return;
    }
    if (!this.currentParentId) {
      this.errorMsg = 'Navega la jerarquía y selecciona los participantes'; return;
    }
    if (!this.isMemberCompetition && this.selectedParticipants.length < 2) {
      this.errorMsg = 'Selecciona al menos 2 participantes'; return;
    }
    if (this.isMemberCompetition && this.selectedParticipants.length === 1) {
      this.errorMsg = 'Selecciona al menos 2 miembros o deja vacío para inscribir a todos'; return;
    }
    if (this.form.competitionType === 'VERSUS') {
      const count = this.selectedParticipants.length;
      if (this.isMemberCompetition && count === 0) {
        this.errorMsg = 'Versus requiere elegir exactamente 2 miembros'; return;
      }
      if (count !== 2) {
        this.errorMsg = 'VERSUS requiere exactamente 2 participantes'; return;
      }
    }
 
    this.saving = true;
 
    const payload: any = {
      name:             this.form.name.trim(),
      competitionType:  this.form.competitionType,
      metricType:       this.form.metricType,
      startDate:        this.form.startDate,
      endDate:          this.form.endDate || undefined,
      scopeReferenceId: this.currentParentId,
      scopeLevel:       this.isMemberCompetition ? 'GRUPO' : this.currentScopeLevel,
      participantMode:  this.isMemberCompetition ? undefined : this.form.participantMode,
    };

    if (this.isMemberCompetition) {
      if (this.selectedParticipants.length > 0) {
        payload.participantUserIds = this.selectedParticipants.map(p => p.id);
      }
    } else {
      payload.participantGroupIds = this.selectedParticipants.map(p => p.id);
    }

    this.adminService.createCompetition(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: (err) => {
        this.saving   = false;
        const body = err?.error;
        this.errorMsg = body?.message || body?.error || err?.message || 'Error al crear la competencia';
      }
    });
  }
 
  onCancel() { this.cancelled.emit(); }
 
  // ─── Helpers ──────────────────────────────────────────────────────────────
 
  hasLeafNodes(): boolean {
    return this.currentNodes.some(n => n.isLeaf);
  }
 
  currentLevelLabel(): string {
    if (!this.currentNodes.length) return 'grupos';
    return this.getNodeLabel(this.currentNodes[0].groupType).toLowerCase() + 's';
  }
 
  getNodeLabel(groupType: string): string {
    const labels: Record<string, string> = {
      EMPRESA:  'Organización',
      FACULTAD: 'Facultad',
      CARRERA:  'Carrera',
      GRUPO:    'Grupo',
      MEMBER:   'Miembro',
    };
    return labels[groupType] ?? groupType;
  }
 
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
 