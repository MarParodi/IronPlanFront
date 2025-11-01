// src/app/features/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../modules/auth/services/auth.service';
// import { User } from '../../core/auth/user.model'; // si tienes interfaz

@Component({
  standalone: true,
  selector: 'ip-dashboard',
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>Bienvenida/o</h2>
      <p *ngIf="user$ | async as user">
        Usuario: {{ user.username }} ({{ user.role }})
      </p>
    </div>
  `
})
export class DashboardComponent {
  private auth = inject(AuthService);
  user$ = this.auth.user$; // Observable<User | null>

  constructor() {
    if (this.auth.isLoggedIn) {
      this.auth.me().subscribe(); // carga el perfil si hay token
    }
  }
}
