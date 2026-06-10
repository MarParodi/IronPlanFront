import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { GruposService } from './services/grupos.service';
import { AuthService } from '../auth/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-grupos-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-ip-page text-ip-primary">
      <div class="max-w-6xl mx-auto px-4 py-6 space-y-6" [class.max-w-none]="isAdministrar" [class.space-y-4]="isAdministrar">
        <header class="space-y-2">
          <h1 class="text-2xl md:text-3xl font-bold text-ip-primary">Grupos</h1>
          <p class="text-sm md:text-base text-ip-muted">
            Organizaciones, equipos y retos grupales
          </p>
        </header>

        <nav class="flex gap-2 border-b border-ip-border/80">
          <a routerLink="/grupos/mis-grupos" routerLinkActive="tab-active" [routerLinkActiveOptions]="{ exact: true }" class="grupos-tab">
            Mis grupos
          </a>
          <a *ngIf="showAdministrar" routerLink="/grupos/administrar" routerLinkActive="tab-active" [routerLinkActiveOptions]="{ exact: true }" class="grupos-tab">
            Administrar
          </a>
        </nav>

        <div [class.admin-outlet]="isAdministrar">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .admin-outlet {
      margin-left: -1rem;
      margin-right: -1rem;
      width: calc(100% + 2rem);
      max-width: none;
    }
    .admin-outlet ::ng-deep .admin-layout {
      height: calc(100vh - 11rem);
      min-height: 480px;
    }
    .grupos-tab {
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: #94a3b8;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s;
    }
    .grupos-tab:hover { color: #e2e8f0; }
    .grupos-tab.tab-active {
      color: #2dd4bf;
      border-bottom-color: #2dd4bf;
    }
  `]
})
export class GruposShellComponent implements OnInit {
  showAdministrar = false;
  isAdministrar = false;

  constructor(
    private gruposService: GruposService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.auth.role === 'ADMIN') {
      this.showAdministrar = true;
    }
    this.gruposService.getAdministrar().subscribe({
      next: (list) => {
        if (list.length > 0) this.showAdministrar = true;
      },
      error: () => { /* mantiene true si ya es ADMIN global */ }
    });
    this.gruposService.getMisGrupos().subscribe({
      next: (list) => {
        if (list.some(g => g.role === 'ADMIN' || g.canManage)) this.showAdministrar = true;
      }
    });

    this.syncRoute(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.syncRoute(e.urlAfterRedirects);
    });
  }

  private syncRoute(url: string) {
    this.isAdministrar = url.includes('/grupos/administrar');
  }
}
