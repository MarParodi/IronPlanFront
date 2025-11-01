import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'ip-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // El backend espera { identifier, password }
  form = { identifier: '', password: '' };
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    if (!this.form.identifier?.trim() || !this.form.password) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({
      identifier: this.form.identifier.trim(),
      password: this.form.password
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        const fe = e?.error?.errors;
        if (fe && typeof fe === 'object') {
          // Muestra errores por campo (temporal, si tu backend los manda así)
          this.error.set(Object.values(fe).join(' · '));
        } else {
          this.error.set(e?.error?.message || 'Credenciales inválidas');
        }
        this.loading.set(false);
      }
    });
  }
}
