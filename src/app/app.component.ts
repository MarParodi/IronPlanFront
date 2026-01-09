// src/app/app.component.ts
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './modules/auth/services/auth.service';
import { FooterComponent } from './core/components/footer/footer.component';
import { HeaderComponent } from './core/components/header/header.component';
import { SpinnerComponent } from './features/components/spinner/spinner.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FooterComponent, HeaderComponent, SpinnerComponent],
  template: `
    <app-header *ngIf="!isAuthRoute" />
    <router-outlet />
    <app-footer *ngIf="!isAuthRoute" />
    <app-spinner />
  `,
  styles: [`
    .topbar{display:flex;gap:12px;align-items:center;padding:10px;border-bottom:1px solid #eee}
    .spacer{flex:1}
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  router = inject(Router);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  isAuthRoute = false;

  constructor() {
    // Detectar rutas de auth para ocultar header/footer
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const authRoutes = ['/login', '/register', '/forgot'];
      this.isAuthRoute = authRoutes.some(route => event.urlAfterRedirects.startsWith(route));
    });
    
    // Check initial route
    const authRoutes = ['/login', '/register', '/forgot'];
    this.isAuthRoute = authRoutes.some(route => this.router.url.startsWith(route));
  }

  logout() { this.auth.logout(); }
}
