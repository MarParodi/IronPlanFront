import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../home/services/admin.service';
import { inferMemberCompetitionFromDetail } from '../../core/utils/competition.util';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
 
export interface CompetitionDetail {
  id:                  number;
  name:                string;
  competitionType:     string;
  scopeLevel:          string;
  scopeReferenceId:    number;
  scopeReferenceName:  string;
  metricType:          string;
  startDate:           string;
  endDate:             string | null;
  status:              string;
  createdAt:           string;
  participantCount:    number;
  isMemberCompetition: boolean;
}
 
export interface LeaderboardEntry {
  rank:          number;
  groupId:       number;
  groupName:     string;
  groupScore:    number;
  activeMembers: number;
}
 
export interface MemberLeaderboardEntry {
  rank:              number;
  userId:            number;
  fullName:          string;
  username:          string;
  profilePictureUrl?: string;
  score:             number;
}
 
@Component({
  selector: 'app-competition-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="modal-overlay" (click)="onClose()">
  <div class="modal" (click)="$event.stopPropagation()">
 
    <!-- ── Header ── -->
    <div class="modal-header">
      <div class="modal-header-left">
        <div class="modal-header-badges" *ngIf="detail">
          <span class="type-badge" [ngClass]="typeClass(detail.competitionType)">
            {{ detail.competitionType }}
          </span>
          <span class="status-pill"
            [class.pill-active]="detail.status === 'ACTIVE'"
            [class.pill-finished]="detail.status === 'FINISHED'"
            [class.pill-draft]="detail.status === 'DRAFT'">
            <span class="pill-dot"></span>
            {{ statusLabel(detail.status) }}
          </span>
        </div>
        <h2>{{ detail?.name || 'Cargando...' }}</h2>
      </div>
      <button class="modal-close" (click)="onClose()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
 
    <!-- ── Loading ── -->
    <div *ngIf="loading" class="modal-loading">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
 
    <!-- ── Body ── -->
    <div *ngIf="!loading && detail" class="modal-body">
 
      <!-- SECCIÓN 1: Info general -->
      <div class="detail-section">
        <span class="section-label">Información general</span>
        <div class="info-grid">
 
          <div class="info-item">
            <span class="info-label">Organización</span>
            <span class="info-value">{{ detail.scopeReferenceName }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Nivel de alcance</span>
            <span class="info-value">{{ scopeLabel(detail.scopeLevel) }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Métrica</span>
            <span class="info-value">{{ metricIcon(detail.metricType) }} {{ metricLabel(detail.metricType) }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Tipo de participantes</span>
            <span class="info-value">
              {{ detail.isMemberCompetition ? '👤 Individual (miembros)' : '🏢 Grupal' }}
            </span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Participantes totales</span>
            <span class="info-value highlight">{{ detail.participantCount }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Fecha de inicio</span>
            <span class="info-value">{{ detail.startDate | date:'dd MMM yyyy' }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Fecha de fin</span>
            <span class="info-value">{{ detail.endDate ? (detail.endDate | date:'dd MMM yyyy') : 'Sin límite' }}</span>
          </div>
 
          <div class="info-item">
            <span class="info-label">Creada el</span>
            <span class="info-value">{{ detail.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
          </div>
 
        </div>
      </div>
 
      <!-- SECCIÓN 2: Leaderboard grupal -->
<div class="detail-section" *ngIf="!detail.isMemberCompetition && leaderboard.length > 0">
  <span class="section-label">Clasificación grupal</span>

  <div class="leaderboard-list">
    <ng-container *ngFor="let entry of leaderboard">

      <!-- Fila del grupo -->
      <div class="lb-row"
           [class.lb-gold]="entry.rank === 1"
           [class.lb-silver]="entry.rank === 2"
           [class.lb-bronze]="entry.rank === 3"
           [class.lb-expanded]="expandedGroupId === entry.groupId">

        <!-- Posición -->
        <div class="lb-rank">
          <span *ngIf="entry.rank === 1">🥇</span>
          <span *ngIf="entry.rank === 2">🥈</span>
          <span *ngIf="entry.rank === 3">🥉</span>
          <span *ngIf="entry.rank > 3" class="rank-num">{{ entry.rank }}</span>
        </div>

        <!-- Avatar + nombre -->
        <div class="lb-avatar group-avatar">
          {{ entry.groupName.charAt(0).toUpperCase() }}
        </div>
        <div class="lb-info">
          <span class="lb-name">{{ entry.groupName }}</span>
          <span class="lb-sub">{{ entry.activeMembers }} miembros activos</span>
        </div>

        <!-- Score -->
        <div class="lb-score">
          <span class="score-value">{{ entry.groupScore | number:'1.0-0' }}</span>
          <span class="score-label">{{ metricLabel(detail.metricType) }}</span>
        </div>

        <!-- Botón expandir -->
        <button class="btn-expand" (click)="toggleGroupMembers(entry.groupId)" title="Ver miembros">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              [attr.d]="expandedGroupId === entry.groupId ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
          </svg>
        </button>

      </div>

      <!-- Panel de miembros expandido -->
      <div *ngIf="expandedGroupId === entry.groupId" class="members-panel">

        <div *ngIf="loadingMembers[entry.groupId]" class="members-loading">
          <div class="spinner-sm"></div>
          Cargando miembros...
        </div>

        <div *ngIf="!loadingMembers[entry.groupId] && groupMembers[entry.groupId]?.length === 0"
             class="members-empty">
          Sin miembros registrados
        </div>

        <div *ngFor="let m of groupMembers[entry.groupId]" class="member-row">
          <div class="member-avatar-sm">{{ m.name.charAt(0) }}</div>
          <span class="member-name">{{ m.name }}</span>
        </div>

      </div>

    </ng-container>
  </div>
</div>
 
      <!-- SECCIÓN 3: Leaderboard individual -->
      <div class="detail-section" *ngIf="detail.isMemberCompetition && memberLeaderboard.length > 0">
        <span class="section-label">Clasificación individual</span>
 
        <div class="leaderboard-list">
          <div *ngFor="let entry of memberLeaderboard" class="lb-row"
               [class.lb-gold]="entry.rank === 1"
               [class.lb-silver]="entry.rank === 2"
               [class.lb-bronze]="entry.rank === 3">
 
            <!-- Posición -->
            <div class="lb-rank">
              <span *ngIf="entry.rank === 1">🥇</span>
              <span *ngIf="entry.rank === 2">🥈</span>
              <span *ngIf="entry.rank === 3">🥉</span>
              <span *ngIf="entry.rank > 3" class="rank-num">{{ entry.rank }}</span>
            </div>
 
            <!-- Avatar -->
            <div class="lb-avatar member-avatar"
                 [style.backgroundImage]="entry.profilePictureUrl ? 'url(' + entry.profilePictureUrl + ')' : 'none'">
              <span *ngIf="!entry.profilePictureUrl">
                {{ getInitials(entry.fullName) }}
              </span>
            </div>
 
            <!-- Info -->
            <div class="lb-info">
              <span class="lb-name">{{ entry.fullName }}</span>
              <span class="lb-sub">{{ '@' + entry.username }}</span>
            </div>
 
            <!-- Score -->
            <div class="lb-score">
              <span class="score-value">{{ entry.score | number:'1.0-0' }}</span>
              <span class="score-label">{{ metricLabel(detail.metricType) }}</span>
            </div>
 
          </div>
        </div>
      </div>
 
      <!-- VERSUS: vista especial si es de 2 participantes -->
      <div class="detail-section versus-section"
           *ngIf="detail.competitionType === 'VERSUS' && leaderboard.length === 2">
        <span class="section-label">Enfrentamiento</span>
        <div class="versus-view">
 
          <!-- Lado A -->
          <div class="versus-side" [class.side-winning]="leaderboard[0].groupScore > leaderboard[1].groupScore">
            <div class="versus-avatar-big">{{ leaderboard[0].groupName.charAt(0) }}</div>
            <span class="versus-name">{{ leaderboard[0].groupName }}</span>
            <span class="versus-score">{{ leaderboard[0].groupScore | number:'1.0-0' }}</span>
            <span class="versus-members">{{ leaderboard[0].activeMembers }} miembros</span>
            <div class="winning-badge" *ngIf="leaderboard[0].groupScore > leaderboard[1].groupScore">
              {{ detail.status === 'FINISHED' ? '🏆 Ganador' : '⬆️ Ganando' }}
            </div>
          </div>
 
          <!-- VS -->
          <div class="versus-center">
            <div class="vs-badge">VS</div>
            <span class="vs-metric">{{ metricLabel(detail.metricType) }}</span>
          </div>
 
          <!-- Lado B -->
          <div class="versus-side" [class.side-winning]="leaderboard[1].groupScore > leaderboard[0].groupScore">
            <div class="versus-avatar-big" style="background: rgba(251,146,60,0.15); color: #fb923c; border-color: rgba(251,146,60,0.3)">
              {{ leaderboard[1].groupName.charAt(0) }}
            </div>
            <span class="versus-name">{{ leaderboard[1].groupName }}</span>
            <span class="versus-score">{{ leaderboard[1].groupScore | number:'1.0-0' }}</span>
            <span class="versus-members">{{ leaderboard[1].activeMembers }} miembros</span>
            <div class="winning-badge" *ngIf="leaderboard[1].groupScore > leaderboard[0].groupScore">
              {{ detail.status === 'FINISHED' ? '🏆 Ganador' : '⬆️ Ganando' }}
            </div>
          </div>
 
        </div>
      </div>

      <!-- SECCIÓN: Podios compuestos (reto individual finalizado) -->
      <div class="detail-section" *ngIf="detail.isMemberCompetition && detail.status === 'FINISHED'">
        <div class="podium-header">
          <span class="section-label">Podios y ganadores</span>
          <button class="btn-generate" (click)="generatePodiums()" [disabled]="generatingPodiums">
            {{ generatingPodiums ? 'Generando...' : (podiums ? 'Regenerar podios' : 'Generar podios') }}
          </button>
        </div>
        <p class="podium-hint">
          Puntuación compuesta: constancia 35% · progresión 1RM 30% · volumen 25%.
          Elige al ganador manualmente entre el top 3 de cada categoría.
        </p>

        <div *ngIf="declaredWinners.length" class="declared-winners">
          <div *ngFor="let w of declaredWinners" class="winner-badge">
            🏆 {{ w.fullName }} — {{ w.levelLabel }}
          </div>
        </div>

        <div *ngIf="!podiums && !generatingPodiums" class="empty-lb">
          <p>Genera los podios para ver el top 3 por categoría.</p>
        </div>

        <ng-container *ngIf="podiums">
          <ng-container *ngTemplateOutlet="podiumPool; context: { title: 'General', scope: 'GENERAL', entries: podiums.generalTop3 }"></ng-container>
          <ng-container *ngFor="let level of levelKeys">
            <ng-container *ngTemplateOutlet="podiumPool; context: {
              title: levelLabels[level],
              scope: 'LEVEL',
              levelCategory: level,
              entries: podiums.byLevel[level] || []
            }"></ng-container>
          </ng-container>
        </ng-container>
      </div>

      <ng-template #podiumPool let-title="title" let-scope="scope" let-levelCategory="levelCategory" let-entries="entries">
        <div class="podium-pool" *ngIf="entries?.length">
          <div class="pool-title">{{ title }}</div>
          <div *ngFor="let e of entries" class="podium-row"
               [class.lb-gold]="e.rank === 1" [class.lb-silver]="e.rank === 2" [class.lb-bronze]="e.rank === 3">
            <div class="lb-rank">
              <span *ngIf="e.rank === 1">🥇</span>
              <span *ngIf="e.rank === 2">🥈</span>
              <span *ngIf="e.rank === 3">🥉</span>
            </div>
            <div class="lb-info">
              <span class="lb-name">{{ e.fullName }}</span>
              <span class="lb-sub">
                Score {{ e.compositeScore | number:'1.1-1' }} ·
                Const. {{ e.consistencyRaw | number:'1.0-0' }} ·
                1RM +{{ e.oneRmProgressRaw | number:'1.1-1' }}% ·
                Vol. {{ e.volumeRaw | number:'1.0-0' }}
              </span>
            </div>
            <button class="btn-declare"
              *ngIf="!hasDeclaredWinner(scope, levelCategory)"
              (click)="declareWinner(scope, levelCategory, e.userId)"
              [disabled]="declaringUserId === e.userId">
              {{ declaringUserId === e.userId ? '...' : 'Elegir ganador' }}
            </button>
            <span *ngIf="isDeclaredWinner(scope, levelCategory, e.userId)" class="winner-tag">Ganador</span>
          </div>
        </div>
      </ng-template>
 
      <!-- Empty leaderboard -->
      <div class="detail-section" *ngIf="leaderboard.length === 0 && memberLeaderboard.length === 0">
        <span class="section-label">Clasificación</span>
        <div class="empty-lb">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2
                 a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14
                 a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p>Aún no hay datos de clasificación.</p>
          <span *ngIf="detail.status === 'DRAFT'">Activa la competencia y recalcula scores para ver el leaderboard.</span>
          <span *ngIf="detail.status !== 'DRAFT'">Recalcula los scores desde la lista de competencias para actualizar la clasificación.</span>
        </div>
      </div>
 
    </div>
 
    <!-- ── Footer ── -->
    <div class="modal-footer" *ngIf="!loading && detail">
      <div class="footer-left">
        <span class="footer-id">ID #{{ detail.id }}</span>
      </div>
      <button class="btn-secondary" (click)="onClose()">Cerrar</button>
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
      border-radius: 20px; width: 100%; max-width: 640px;
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 30px 80px rgba(0,0,0,0.8);
    }
 
    /* Header */
    .modal-header {
      padding: 18px 20px 0; display: flex;
      align-items: flex-start; justify-content: space-between;
      flex-shrink: 0; gap: 12px;
    }
    .modal-header-left { display: flex; flex-direction: column; gap: 6px; }
    .modal-header-badges { display: flex; align-items: center; gap: 6px; }
    .modal-header h2 { font-size: 17px; font-weight: 700; color: #f8fafc; margin: 0; }
    .modal-close {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: 7px; background: transparent; border: none; color: #64748b;
      cursor: pointer; flex-shrink: 0;
    }
    .modal-close:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
 
    /* Loading */
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
 
    /* Body */
    .modal-body {
      padding: 16px 20px; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: 20px;
    }
 
    /* Secciones */
    .detail-section { display: flex; flex-direction: column; gap: 10px; }
    .section-label {
      font-size: 10px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.8px;
    }
 
    /* Info grid */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1px; background: rgba(255,255,255,0.05);
      border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .info-item {
      display: flex; flex-direction: column; gap: 3px;
      padding: 10px 14px; background: #1b1f23;
    }
    .info-label { font-size: 10px; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }
    .info-value { font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .info-value.highlight { color: #2dd4bf; font-size: 16px; font-weight: 700; }
 
    /* Leaderboard */
    .leaderboard-list { display: flex; flex-direction: column; gap: 4px; }
    .lb-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      background: #1b1f23; border: 1px solid rgba(255,255,255,0.05);
      transition: border-color 0.15s;
    }
    .lb-row:hover { border-color: rgba(255,255,255,0.1); }
    .lb-gold   { border-color: rgba(251,191,36,0.25)  !important; background: rgba(251,191,36,0.04)  !important; }
    .lb-silver { border-color: rgba(148,163,184,0.25) !important; background: rgba(148,163,184,0.04) !important; }
    .lb-bronze { border-color: rgba(180,120,60,0.25)  !important; background: rgba(180,120,60,0.04)  !important; }
 
    .lb-rank { width: 28px; text-align: center; font-size: 18px; flex-shrink: 0; }
    .rank-num { font-size: 13px; font-weight: 700; color: #64748b; }
 
    .lb-avatar {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; background-size: cover; background-position: center;
    }
    .group-avatar  { background: rgba(45,212,191,0.15); color: #2dd4bf; border: 1px solid rgba(45,212,191,0.2); }
    .member-avatar { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }
 
    .lb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .lb-name { font-size: 13px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lb-sub  { font-size: 11px; color: #475569; }
 
    .lb-score { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
    .score-value { font-size: 15px; font-weight: 700; color: #2dd4bf; }
    .score-label { font-size: 10px; color: #475569; white-space: nowrap; }
 
    /* VERSUS */
    .versus-view {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 16px;
      background: linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(251,146,60,0.04) 100%);
      border: 1px solid var(--ip-faint-border-color); border-radius: 14px;
    }
    .versus-side {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; gap: 6px; text-align: center;
      padding: 12px 8px; border-radius: 10px;
      border: 1px solid transparent; transition: border-color 0.2s;
    }
    .side-winning { border-color: rgba(45,212,191,0.2); background: rgba(45,212,191,0.04); }
    .versus-avatar-big {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(45,212,191,0.15); color: #2dd4bf;
      border: 1.5px solid rgba(45,212,191,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 800;
    }
    .versus-name  { font-size: 13px; font-weight: 600; color: #f1f5f9; }
    .versus-score { font-size: 22px; font-weight: 800; color: #2dd4bf; }
    .versus-members { font-size: 11px; color: #64748b; }
    .winning-badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: 20px; background: rgba(45,212,191,0.12);
      border: 1px solid rgba(45,212,191,0.25); color: #2dd4bf;
    }
    .versus-center { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
    .vs-badge {
      width: 40px; height: 40px; border-radius: 50%;
      background: #0f1214; border: 1.5px solid rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;
    }
    .vs-metric { font-size: 10px; color: #475569; }
 
    /* Empty */
    .empty-lb {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #475569; font-size: 13px; text-align: center;
      background: rgba(255,255,255,0.02); border-radius: 12px;
      border: 1px dashed rgba(255,255,255,0.07);
    }
    .empty-lb span { font-size: 12px; color: #334155; }
 
    /* Badges */
    .type-badge {
      font-size: 10px; font-weight: 700; padding: 3px 8px;
      border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .badge-ranking  { background: rgba(245,158,11,0.15); color: #fcd34d; }
    .badge-challenge{ background: rgba(239,68,68,0.15);  color: #fca5a5; }
    .badge-versus   { background: rgba(168,85,247,0.15); color: #d8b4fe; }
 
    .status-pill {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px;
    }
    .pill-active   { background: rgba(45,212,191,0.12); color: #2dd4bf; }
    .pill-finished { background: rgba(100,116,139,0.15); color: #94a3b8; }
    .pill-draft    { background: rgba(245,158,11,0.12); color: #fcd34d; }
    .pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
 
    /* Footer */
    .modal-footer {
      padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .footer-id { font-size: 11px; color: #334155; font-family: monospace; }
    .btn-secondary {
      padding: 7px 16px; border-radius: 9px;
      background: rgba(255,255,255,0.05); color: #cbd5e1;
      font-size: 13px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.09); }

    .lb-expanded { border-radius: 10px 10px 0 0 !important; border-bottom-color: transparent !important; }

.btn-expand {
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); color: #64748b;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.btn-expand:hover { background: rgba(45,212,191,0.1); color: #2dd4bf; border-color: rgba(45,212,191,0.25); }

.members-panel {
  background: #141618; border: 1px solid rgba(255,255,255,0.05);
  border-top: none; border-radius: 0 0 10px 10px;
  padding: 8px 12px; display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 4px;
}

.members-loading {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #64748b; padding: 8px;
}
.spinner-sm {
  width: 14px; height: 14px; border: 2px solid rgba(45,212,191,0.2);
  border-top-color: #2dd4bf; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.members-empty { font-size: 12px; color: #334155; padding: 8px; font-style: italic; }

.member-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 7px;
}
.member-row:hover { background: rgba(255,255,255,0.03); }

.member-avatar-sm {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  background: rgba(45,212,191,0.1); color: #2dd4bf;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.member-name { font-size: 12px; color: #cbd5e1; }

    .podium-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .podium-hint { font-size: 11px; color: #64748b; margin: 0; line-height: 1.4; }
    .btn-generate {
      padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
      background: rgba(45,212,191,0.15); color: #2dd4bf; border: 1px solid rgba(45,212,191,0.3); cursor: pointer;
    }
    .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }
    .declared-winners { display: flex; flex-wrap: wrap; gap: 8px; }
    .winner-badge {
      font-size: 12px; padding: 6px 10px; border-radius: 8px;
      background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25); color: #fcd34d;
    }
    .podium-pool { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .pool-title { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
    .podium-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
      background: #1b1f23; border: 1px solid rgba(255,255,255,0.05); }
    .btn-declare {
      padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 600; flex-shrink: 0;
      background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); cursor: pointer;
    }
    .btn-declare:disabled { opacity: 0.5; }
    .winner-tag { font-size: 11px; font-weight: 700; color: #fcd34d; flex-shrink: 0; }

  `]
})
export class CompetitionDetailModalComponent implements OnInit {

    expandedGroupId?: number;
    groupMembers: { [groupId: number]: any[] } = {};
    loadingMembers: { [groupId: number]: boolean } = {};
 
  @Input()  competitionId!: number;
  @Output() closed = new EventEmitter<void>();
 
  detail:            CompetitionDetail | null = null;
  leaderboard:       LeaderboardEntry[]       = [];
  memberLeaderboard: MemberLeaderboardEntry[] = [];
  podiums: any = null;
  declaredWinners: any[] = [];
  generatingPodiums = false;
  declaringUserId: number | null = null;
  levelKeys = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
  levelLabels: Record<string, string> = {
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZADO: 'Avanzado',
  };
  loading = true;
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void {
    this.loadAll();
  }
 
  loadAll() {
    this.loading = true;

    forkJoin({
      adminDetail: this.adminService.getCompetitionById(this.competitionId),
      view: this.adminService.getCompetitionView(this.competitionId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ adminDetail, view }) => {
        this.detail = adminDetail;

        const isMember = inferMemberCompetitionFromDetail({
          competition: adminDetail,
          ...view,
          myScore: view?.myScore,
        });
        if (this.detail) this.detail.isMemberCompetition = isMember;

        if (isMember) {
          this.memberLeaderboard = view?.memberLeaderboard ?? [];
          this.leaderboard = [];
        } else {
          this.leaderboard = view?.groupLeaderboard ?? [];
          this.memberLeaderboard = [];
        }

        if (isMember && this.detail?.status === 'FINISHED') {
          this.loadPodiumData();
        } else {
          this.loading = false;
        }
      },
      error: () => { this.loading = false; },
    });
  }

  loadPodiumData() {
    forkJoin({
      podiums: this.adminService.getPodiums(this.competitionId).pipe(catchError(() => of(null))),
      winners: this.adminService.getDeclaredWinners(this.competitionId).pipe(catchError(() => of([]))),
    }).subscribe(({ podiums, winners }) => {
      this.podiums = podiums?.generalTop3?.length || podiums?.byLevel ? podiums : null;
      this.declaredWinners = winners || [];
      this.loading = false;
    });
  }

  generatePodiums() {
    if (!confirm('¿Generar podios con la puntuación compuesta actual?')) return;
    this.generatingPodiums = true;
    this.adminService.generatePodiums(this.competitionId).subscribe({
      next: (resp) => {
        this.podiums = resp;
        this.generatingPodiums = false;
      },
      error: (err) => {
        this.generatingPodiums = false;
        alert(err?.error?.message || 'No se pudieron generar los podios');
      },
    });
  }

  declareWinner(scope: 'GENERAL' | 'LEVEL', levelCategory: string | undefined, userId: number) {
    const label = scope === 'GENERAL' ? 'General' : this.levelLabels[levelCategory || ''] || levelCategory;
    if (!confirm(`¿Declarar ganador en categoría ${label}?`)) return;
    this.declaringUserId = userId;
    this.adminService.declareWinner(this.competitionId, {
      scope,
      levelCategory: scope === 'LEVEL' ? levelCategory : undefined,
      userId,
    }).subscribe({
      next: (winner) => {
        this.declaredWinners = [...this.declaredWinners.filter(w =>
          !(w.scope === scope && (w.levelCategory || null) === (levelCategory || null))
        ), winner];
        this.declaringUserId = null;
      },
      error: (err) => {
        this.declaringUserId = null;
        alert(err?.error?.message || 'No se pudo declarar el ganador');
      },
    });
  }

  hasDeclaredWinner(scope: string, levelCategory?: string): boolean {
    return this.declaredWinners.some(w =>
      w.scope === scope && (w.levelCategory || null) === (levelCategory || null)
    );
  }

  isDeclaredWinner(scope: string, levelCategory: string | undefined, userId: number): boolean {
    return this.declaredWinners.some(w =>
      w.scope === scope &&
      (w.levelCategory || null) === (levelCategory || null) &&
      w.userId === userId
    );
  }

  toggleGroupMembers(groupId: number) {
    if (this.expandedGroupId === groupId) {
        this.expandedGroupId = undefined;
        return;
    }
    this.expandedGroupId = groupId;
    if (this.groupMembers[groupId]) return; // ya cargados

    this.loadingMembers[groupId] = true;
    this.adminService.getParticipantMembers(this.competitionId, groupId).subscribe({
        next: (data) => {
            this.groupMembers[groupId] = data;
            this.loadingMembers[groupId] = false;
        },
        error: () => { this.loadingMembers[groupId] = false; }
    });
}
 
  onClose() { this.closed.emit(); }
 
  typeClass(type: string): string {
    return ({ RANKING: 'badge-ranking', CHALLENGE: 'badge-challenge', VERSUS: 'badge-versus' })[type] ?? '';
  }
 
  statusLabel(s: string): string {
    return ({ ACTIVE: 'En curso', FINISHED: 'Finalizada', DRAFT: 'Borrador' })[s] ?? s;
  }
 
  metricLabel(m: string): string {
    return ({
      SESSIONS: 'Sesiones', ACTIVE_MINUTES: 'Minutos activos', WORKOUTS_COUNT: 'Entrenamientos',
      VOLUME_TOTAL: 'Volumen total (kg)', FREE_ACTIVITY_COUNT: 'Actividades libres', FREE_ACTIVITY_KM: 'Km actividad libre',
    })[m] ?? m;
  }

  metricIcon(m: string): string {
    return ({
      SESSIONS: '🏋️', ACTIVE_MINUTES: '⏱️', WORKOUTS_COUNT: '🔥', VOLUME_TOTAL: '💪',
      FREE_ACTIVITY_COUNT: '🏃', FREE_ACTIVITY_KM: '📍',
    })[m] ?? '📊';
  }
 
  scopeLabel(s: string): string {
    return ({ EMPRESA: 'Organización', FACULTAD: 'Facultad', CARRERA: 'Carrera', GRUPO: 'Grupo' })[s] ?? s;
  }
 
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}