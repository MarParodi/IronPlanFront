// src/app/app.component.ts
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './modules/auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <nav class="topbar">
      <a routerLink="/">IronPlan</a>
      <span class="spacer"></span>
      <ng-container *ngIf="isBrowser; else guestOrSSR">
        <ng-container *ngIf="auth.isLoggedIn; else guest">
          <a routerLink="/admin" *ngIf="auth.role==='ADMIN'">Admin</a>
          <button (click)="logout()">Salir</button>
        </ng-container>
        <ng-template #guest>
          <a routerLink="/login">Login</a>
          <a routerLink="/register">Registro</a>
        </ng-template>
      </ng-container>
      <ng-template #guestOrSSR>
        <!-- En SSR, muestra skeleton o enlaces neutros -->
        <a routerLink="/login">Login</a>
        <a routerLink="/register">Registro</a>
      </ng-template>
    </nav>
    <main><router-outlet /></main>
  `,
  styles: [`
    .topbar{display:flex;gap:12px;align-items:center;padding:10px;border-bottom:1px solid #eee}
    .spacer{flex:1}
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  logout(){ this.auth.logout(); }
}
