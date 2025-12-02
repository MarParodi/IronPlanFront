import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Gender, Level, RegisterReq } from '../../models/auth.models';

@Component({
  standalone: true,
  selector: 'ip-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  genders: {label: string; value: Gender}[] = [
    { label: 'Femenino',  value: 'FEMENINO' },
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Otro',      value: 'OTRO' },
  ];
get trainDaysPercent(): string {
  const min = 1;
  const max = 7;
  const value = this.form.trainDays ?? min;
  const pct = ((value - min) / (max - min)) * 100;
  return pct + '%';
}

  levels: {label: string; value: Level}[] = [
    { label: 'Principiante', value: 'NOVATO' },
    { label: 'Intermedio',   value: 'INTERMEDIO' },
    { label: 'Avanzado',     value: 'AVANZADO' },
  ];

  form: RegisterReq = {
    email: '',
    username: '',
    password: '',
    gender: 'FEMENINO',
    birthday: '',      
    level: 'NOVATO',
    trainDays: 3,     
  };

  loading = signal(false);
  error   = signal<string | null>(null);
  ok      = signal(false);

  // helper para españolizar “día(s)”
  get trainDaysLabel() {
    const n = this.form.trainDays ?? 0;
    return `${n} ${n === 1 ? 'día' : 'días'}`;
    // Si quieres “Días de entrenamiento: X” en el título, lo haces en HTML.
  }

  submit() {
    // Validaciones simples
    if (!this.form.email?.trim() || !this.form.password || !this.form.username?.trim()) {
      this.error.set('Completa email, contraseña y usuario.');
      return;
    }
    if (!this.form.gender || !this.form.level) {
      this.error.set('Selecciona género y nivel.');
      return;
    }
    if (!this.form.birthday) {
      this.error.set('Selecciona tu fecha de nacimiento.');
      return;
    }
    if (!this.form.trainDays || this.form.trainDays < 1 || this.form.trainDays > 7) {
      this.error.set('Selecciona días de entrenamiento entre 1 y 7.');
      return;
    }

    // Normaliza strings
    const payload: RegisterReq = {
      ...this.form,
      email: this.form.email.trim(),
      username: this.form.username.trim(),
      // birthDate ya viene como yyyy-MM-dd del input date
    };

    this.loading.set(true);
    this.error.set(null);

    this.auth.register(payload).subscribe({
      next: () => {
        this.ok.set(true);
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (e) => {
        const fe = e?.error?.errors;
        if (fe && typeof fe === 'object') {
          this.error.set(Object.values(fe).join(' · '));
        } else {
          this.error.set(e?.error?.message || e?.message || 'Error al registrar');
        }
        this.loading.set(false);
      }
    });
  }
}
