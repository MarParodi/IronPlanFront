import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GruposService, MembershipSummary } from './services/grupos.service';
import { JoinOrganizationComponent } from '../admin/join-organization.component';
import { OrgCascadeFormComponent } from '../admin/org-cascade-form.component';
 
@Component({
  selector: 'app-mis-grupos',
  standalone: true,
  imports: [CommonModule, RouterModule, JoinOrganizationComponent, OrgCascadeFormComponent],
  template: `
    <section class="space-y-6">
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-50">Mis grupos</h2>
        <p class="text-sm text-slate-400">Grupos organizacionales a los que perteneces</p>
      </div>
 
      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-slate-400">Cargando grupos...</p>
        </div>
      </div>
 
      <!-- Sin grupos: dos caminos -->
      <div *ngIf="!loading && groups.length === 0" class="space-y-4">
 
        <!-- Opción A: Unirse con código -->
        <div class="option-card" [class.option-card--active]="emptyAction === 'join'" (click)="emptyAction = 'join'">
          <div class="option-card__icon teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div class="option-card__body">
            <h3>Unirse con código</h3>
            <p>Alguien de tu organización te compartió un código de invitación.</p>
          </div>
          <div class="option-card__arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
 
        <!-- Formulario unirse -->
        <div *ngIf="emptyAction === 'join'" class="option-content">
          <app-join-organization (joined)="onJoined()" />
        </div>
 
        <div class="option-divider">
          <span>o</span>
        </div>
 
        <!-- Opción B: Crear organización propia -->
        <div class="option-card" [class.option-card--active]="emptyAction === 'create'" (click)="emptyAction = 'create'">
          <div class="option-card__icon violet">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div class="option-card__body">
            <h3>Crear mi organización</h3>
            <p>Sé el administrador y crea tu propia estructura organizacional.</p>
          </div>
          <div class="option-card__arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
 
      </div>
 
      <!-- Con grupos: lista normal -->
      <div *ngIf="!loading && groups.length > 0" class="space-y-4">
        <article *ngFor="let g of groups"
          class="rounded-2xl bg-ip-surface border border-slate-800 p-5 hover:border-slate-700 transition-colors">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span [class]="roleBadgeClass(g.role === 'ADMIN')">
              {{ g.role === 'ADMIN' ? 'Administrador' : 'Miembro' }}
            </span>
            <span class="text-[11px] text-slate-500 uppercase tracking-wide">{{ g.groupType }}</span>
          </div>
 
          <h3 class="text-lg font-semibold text-slate-50 mb-1">{{ g.groupName }}</h3>
          <p class="text-sm text-slate-400 mb-1">{{ g.hierarchyPath.displayPath }}</p>
          <p *ngIf="g.hierarchyPath.rootName" class="text-xs text-slate-500 mb-4">
            {{ g.hierarchyPath.rootName }}
          </p>
 
          <div class="flex flex-wrap gap-4 text-sm text-slate-300 mb-4">
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ g.memberCount }} miembros
            </span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              {{ g.activeCompetitionsCount }} retos activos
            </span>
          </div>
 
          <a [routerLink]="['/grupos', g.groupId, 'resumen']"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                   bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/25 transition">
            Ver grupo
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </article>
 
        <!-- Panel "¿Quieres más?" — unirse o crear -->
        <div class="rounded-2xl border border-dashed border-slate-700 bg-ip-surface/50 p-5 space-y-3">
          <h4 class="text-sm font-semibold text-slate-200">¿Quieres unirte o crear otra organización?</h4>
          <div class="flex flex-wrap gap-3">
            <button type="button"
              class="text-sm font-medium text-teal-400 hover:text-teal-300 transition"
              (click)="toggleExtra('join')">
              {{ extraAction === 'join' ? 'Ocultar' : '🔑 Unirse con código' }}
            </button>
            <span class="text-slate-700">·</span>
            <button type="button"
              class="text-sm font-medium text-violet-400 hover:text-violet-300 transition"
              (click)="toggleExtra('create')">
              {{ extraAction === 'create' ? 'Ocultar' : '🏢 Crear organización' }}
            </button>
          </div>
 
          <app-join-organization *ngIf="extraAction === 'join'" (joined)="onJoined()" />
        </div>
      </div>
    </section>
 
    <!-- Modal crear organización (reutiliza app-org-cascade-form) -->
    <app-org-cascade-form
      *ngIf="showCreateModal"
      (saved)="onOrgCreated()"
      (cancelled)="onOrgCancelled()">
    </app-org-cascade-form>
  `,
  styles: [`
    :host { display: block; }
 
    /* ── Tarjetas de opción (estado sin grupos) ── */
    .option-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 14px;
      background: #171a1d;
      border: 1px solid rgb(30 41 59);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .option-card:hover {
      border-color: rgb(51 65 85);
      background: #1b1f24;
    }
    .option-card--active {
      border-color: rgba(45,212,191,0.4);
      background: rgba(45,212,191,0.04);
    }
 
    .option-card__icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .option-card__icon.teal   { background: rgba(45,212,191,0.12); color: #2dd4bf; }
    .option-card__icon.violet { background: rgba(139,92,246,0.12); color: #a78bfa; }
 
    .option-card__body { flex: 1; min-width: 0; }
    .option-card__body h3 {
      font-size: 14px; font-weight: 600; color: #f1f5f9; margin: 0 0 3px;
    }
    .option-card__body p {
      font-size: 13px; color: #64748b; margin: 0;
    }
 
    .option-card__arrow { color: #334155; flex-shrink: 0; }
    .option-card--active .option-card__arrow { color: #2dd4bf; }
 
    /* ── Contenedor del sub-formulario ── */
    .option-content {
      padding-left: 4px;
    }
 
    /* ── Divisor "o" ── */
    .option-divider {
      display: flex; align-items: center; gap: 12px;
      color: #334155; font-size: 13px; font-weight: 500;
    }
    .option-divider::before,
    .option-divider::after {
      content: ''; flex: 1;
      height: 1px; background: rgba(255,255,255,0.06);
    }
  `]
})
export class MisGruposComponent implements OnInit {
  groups: MembershipSummary[] = [];
  loading = true;
 
 
  /** Acción extra cuando YA hay grupos */
  extraAction: 'join' | 'create' | null = null;
 
  /** Controla la visibilidad del modal de creación */
  showCreateModal = false;
 
  constructor(private gruposService: GruposService) {}
 
  ngOnInit(): void {
    this.load();
  }
 
  load() {
    this.loading = true;
    this.gruposService.getMisGrupos().subscribe({
      next: (data) => { this.groups = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
 
  onJoined() {
    this.emptyAction = null;
    this.extraAction = null;
    this.load();
  }
 
  onOrgCreated() {
    this.showCreateModal = false;
    this.emptyAction = null;
    this.extraAction = null;
    this.load();
  }
 
  onOrgCancelled() {
    this.showCreateModal = false;
    // Volvemos a mostrar las tarjetas de opción
    this.emptyAction = null;
    this.extraAction = null;
  }
 
  /** Maneja click en tarjetas cuando NO hay grupos */
  // El setter de emptyAction ya controla qué se muestra.
  // Si el usuario elige "create" abrimos el modal directamente.
  set emptyActionSetter(value: 'join' | 'create' | null) {
    this._emptyAction = value;
    if (value === 'create') {
      this._emptyAction = null;
      this.showCreateModal = true;
    }
  }
 
  private _emptyAction: 'join' | 'create' | null = null;
  get emptyAction() { return this._emptyAction; }
  set emptyAction(value: 'join' | 'create' | null) {
    if (value === 'create') {
      this._emptyAction = null;
      this.showCreateModal = true;
    } else {
      this._emptyAction = value;
    }
  }
 
  /** Maneja botones del panel extra cuando YA hay grupos */
  toggleExtra(action: 'join' | 'create') {
    if (action === 'create') {
      this.showCreateModal = true;
      this.extraAction = null;
      return;
    }
    this.extraAction = this.extraAction === action ? null : action;
  }
 
  roleBadgeClass(isAdmin: boolean): string {
    return isAdmin
      ? 'text-[11px] font-semibold px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/25'
      : 'text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-300';
  }
}
 