// src/app/app.component.ts
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './modules/auth/services/auth.service';
import { FooterComponent } from './core/components/footer/footer.component';

import { HeaderComponent } from './core/components/header/header.component';
import { SpinnerComponent } from './features/components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FooterComponent, HeaderComponent, SpinnerComponent],
  template: `
     <app-header  />
    <router-outlet />
    <app-footer  />
    <app-spinner />
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
