import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'ip-forgotpassword',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css'],
})
export class ForgotpasswordComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  // Controla en qué paso estamos: 1 | 2 | 3
  step = signal<1 | 2 | 3>(1);

  email    = '';
  code     = '';
  newPassword     = '';
  confirmPassword = '';

  loading = signal(false);
  error   = signal<string | null>(null);
  success = signal<string | null>(null);

  // PASO 1 → enviar código al email
  sendCode() {
    if (!this.email?.trim()) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.forgotPassword({ email: this.email.trim() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'No se pudo enviar el correo.');
        this.loading.set(false);
      }
    });
  }

  // PASO 2 → verificar código
  verifyCode() {
    if (!this.code?.trim()) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.verifyResetCode({ email: this.email.trim(), code: this.code.trim() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(3);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Código incorrecto o expirado.');
        this.loading.set(false);
      }
    });
  }

  // PASO 3 → nueva contraseña
  resetPassword() {
    if (!this.newPassword || this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.resetPassword({
      email: this.email.trim(),
      code: this.code.trim(),
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('¡Contraseña actualizada! Redirigiendo...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'No se pudo actualizar la contraseña.');
        this.loading.set(false);
      }
    });
  }
}