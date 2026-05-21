import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GruposService, MembershipSummary } from './services/grupos.service';
import { JoinOrganizationComponent } from '../admin/join-organization.component';

@Component({
  selector: 'app-mis-grupos',
  standalone: true,
  imports: [CommonModule, RouterModule, JoinOrganizationComponent],
  template: `
    <section class="space-y-6">
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-50">Mis grupos</h2>
        <p class="text-sm text-slate-400">Grupos organizacionales a los que perteneces</p>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-slate-400">Cargando grupos...</p>
        </div>
      </div>

      <div *ngIf="!loading && groups.length === 0" class="flex justify-center py-4">
        <app-join-organization (joined)="onJoined()" />
      </div>

      <div *ngIf="!loading && groups.length > 0" class="space-y-4">
        <article *ngFor="let g of groups"
          class="rounded-2xl bg-[#171a1d] border border-slate-800 p-5 hover:border-slate-700 transition-colors">
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

        <div class="rounded-2xl border border-dashed border-slate-700 bg-[#171a1d]/50 p-5 space-y-3">
          <h4 class="text-sm font-semibold text-slate-200">¿Tienes otro código?</h4>
          <p class="text-sm text-slate-400">Puedes unirte a otra organización con un código de invitación.</p>
          <button type="button"
            class="text-sm font-medium text-teal-400 hover:text-teal-300 transition"
            (click)="showJoin = !showJoin">
            {{ showJoin ? 'Ocultar' : 'Unirse con código' }}
          </button>
          <app-join-organization *ngIf="showJoin" (joined)="onJoined()" />
        </div>
      </div>
    </section>
  `,
  styles: [`:host { display: block; }`]
})
export class MisGruposComponent implements OnInit {
  groups: MembershipSummary[] = [];
  loading = true;
  showJoin = false;

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
    this.showJoin = false;
    this.load();
  }

  roleBadgeClass(isAdmin: boolean): string {
    return isAdmin
      ? 'text-[11px] font-semibold px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/25'
      : 'text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-300';
  }
}
