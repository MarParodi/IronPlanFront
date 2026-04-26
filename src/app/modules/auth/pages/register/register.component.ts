import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  Gender,
  Goal,
  Level,
  RegisterStep1Req,
  RegisterStep2Req,
  RegisterStep3Req,
  RegisterStep4Req,
} from '../../models/auth.models';

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

  step = signal<1 | 2 | 3 | 4>(1);

  genders: {label: string; value: Gender}[] = [
    { label: 'Femenino',  value: 'FEMENINO' },
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Otro',      value: 'OTRO' },
  ];
  
get trainDaysPercent(): string {
  const min = 1;
  const max = 7;
  const value = this.form2.trainDays ?? min;
  const pct = ((value - min) / (max - min)) * 100;
  return pct + '%';
}

  levels: {label: string; value: Level}[] = [
    { label: 'Principiante', value: 'NOVATO' },
    { label: 'Intermedio',   value: 'INTERMEDIO' },
    { label: 'Avanzado',     value: 'AVANZADO' },
  ];

  goals: { label: string; value: Goal }[] = [
    { label: 'Hipertrofia', value: 'HIPERTROFIA' },
    { label: 'Fuerza', value: 'FUERZA' },
    { label: 'Resistencia', value: 'RESISTENCIA' },
  ];

  form1: RegisterStep1Req = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  form2: Omit<RegisterStep2Req, 'onboardingToken'> = {
    birthday: '',
    gender: 'FEMENINO',
    weight: null,
    height: null,
    level: 'NOVATO',
    trainDays: 3,
    goal: 'HIPERTROFIA',
  };

  form3: Omit<RegisterStep3Req, 'onboardingToken'> = {
    organizationCode: '',
    organizationGroup: '',
    organizationRole: '',
  };

  form4: Omit<RegisterStep4Req, 'onboardingToken'> = {
    acceptedTerms: false,
    acceptedPrivacy: false,
    consentProgramMetrics: false,
  };

  loading = signal(false);
  error   = signal<string | null>(null);
  ok      = signal(false);

  // helper para españolizar “día(s)”
  get trainDaysLabel() {
    const n = this.form2.trainDays ?? 0;
    return `${n} ${n === 1 ? 'día' : 'días'}`;
    // Si quieres “Días de entrenamiento: X” en el título, lo haces en HTML.
  }

  back() {
    const s = this.step();
    if (s > 1) this.step.set((s - 1) as any);
    this.error.set(null);
  }

  submitStep1() {
    if (!this.form1.firstName.trim() || !this.form1.lastName.trim()) {
      this.error.set('Completa nombre y apellido.');
      return;
    }
    if (!this.form1.email.trim() || !this.form1.username.trim()) {
      this.error.set('Completa email y nombre de usuario.');
      return;
    }
    if (!this.form1.password || !this.form1.confirmPassword) {
      this.error.set('Completa contraseña y confirmación.');
      return;
    }
    if (this.form1.password !== this.form1.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    const payload: RegisterStep1Req = {
      ...this.form1,
      firstName: this.form1.firstName.trim(),
      lastName: this.form1.lastName.trim(),
      email: this.form1.email.trim(),
      username: this.form1.username.trim(),
    };

    this.loading.set(true);
    this.error.set(null);

    this.auth.registerStep1(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
      },
      error: (e) => this.handleError(e),
    });
  }

  submitStep2() {
    const token = this.auth.onboardingToken;
    if (!token) {
      this.error.set('Tu registro expiró. Vuelve a iniciar.');
      this.step.set(1);
      return;
    }
    if (!this.form2.birthday) {
      this.error.set('Selecciona tu fecha de nacimiento.');
      return;
    }
    if (!this.form2.trainDays || this.form2.trainDays < 1 || this.form2.trainDays > 7) {
      this.error.set('Selecciona días de entrenamiento entre 1 y 7.');
      return;
    }

    const payload: RegisterStep2Req = {
      onboardingToken: token,
      ...this.form2,
    };

    this.loading.set(true);
    this.error.set(null);

    this.auth.registerStep2(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(3);
      },
      error: (e) => this.handleError(e),
    });
  }

  submitStep3() {
  const token = this.auth.onboardingToken;
  if (!token) {
    this.error.set('Tu registro expiró. Vuelve a iniciar.');
    this.step.set(1);
    return;
  }

  // Si no puso código, omitir paso (usuario individual)
  if (!this.form3.organizationCode.trim()) {
    this.step.set(4);
    this.error.set(null);
    return;
  }

  const payload: RegisterStep3Req = {
    onboardingToken: token,
    organizationCode: this.form3.organizationCode.trim().toUpperCase(),
    organizationGroup: '',
    organizationRole: '',
  };

  this.loading.set(true);
  this.error.set(null);

  this.auth.registerStep3(payload).subscribe({
    next: () => {
      this.loading.set(false);
      this.step.set(4);
    },
    error: (e) => this.handleError(e),
  });
}

  submitStep4() {
    const token = this.auth.onboardingToken;
    if (!token) {
      this.error.set('Tu registro expiró. Vuelve a iniciar.');
      this.step.set(1);
      return;
    }
    if (!this.form4.acceptedTerms || !this.form4.acceptedPrivacy || !this.form4.consentProgramMetrics) {
      this.error.set('Debes aceptar todos los consentimientos para continuar.');
      return;
    }

    const payload: RegisterStep4Req = {
      onboardingToken: token,
      ...this.form4,
    };

    this.loading.set(true);
    this.error.set(null);

    this.auth.registerStep4(payload).subscribe({
      next: () => {
        this.ok.set(true);
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (e) => this.handleError(e),
    });
  }

  private handleError(e: any) {
    const fe = e?.error?.errors;
    if (fe && typeof fe === 'object') {
      this.error.set(Object.values(fe).join(' · '));
    } else {
      this.error.set(e?.error?.message || e?.message || 'Error en el registro');
    }
    this.loading.set(false);
  }
}
