import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

// Ajusta estos tipos si ya los tienes en otro archivo
export type Level = 'NOVATO' | 'INTERMEDIO' | 'AVANZADO';
// Si en tu backend trainDays es enum, normalmente viaja como string.
// Pero como tú ya lo estás tratando como 1-7 para el porcentaje,
// lo manejamos como number en el form.
export type TrainDays = 1 | 2 | 3 | 4 | 5 | 6 | 7;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  isUploading = false;
  saveError: string | null = null;
  saveOk = false;

  imagePreview: string | null = null;
  selectedFile: File | null = null;
  user: any;

  // Enum Level (para tu select)
  levels: { label: string; value: Level }[] = [
    { label: 'Principiante', value: 'NOVATO' },
    { label: 'Intermedio', value: 'INTERMEDIO' },
    { label: 'Avanzado', value: 'AVANZADO' },
  ];

  // Opciones para trainDays (1–7)
  trainDaysOptions: { label: string; value: TrainDays }[] = [
    { label: '1 día', value: 1 },
    { label: '2 días', value: 2 },
    { label: '3 días', value: 3 },
    { label: '4 días', value: 4 },
    { label: '5 días', value: 5 },
    { label: '6 días', value: 6 },
    { label: '7 días', value: 7 },
  ];

  profileForm = this.fb.group({

    username: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]{3,20}$/)]],
    password: [''], // opcional: si viene vacío, no lo mandamos
    email: ['', [Validators.required, Validators.email]],
    level: ['NOVATO' as Level, [Validators.required]],
    trainDays: [3 as TrainDays, [Validators.required, Validators.min(1), Validators.max(7)]],
    weight: [null as number | null, [Validators.min(20), Validators.max(400)]],
    height: [null as number | null, [Validators.min(80), Validators.max(250)]],

    currentPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
  },
    { validators: [this.passwordChangeValidator] }

  );

  passwordChangeValidator(group: any) {
    const current = group.get('currentPassword')?.value?.trim();
    const next = group.get('newPassword')?.value?.trim();
    const confirm = group.get('confirmPassword')?.value?.trim();

    const wantsChange = !!(current || next || confirm);

    // Si no quiere cambiar password: válido
    if (!wantsChange) return null;

    // Si quiere cambiar: debe llenar todos
    if (!current || !next || !confirm) return { passwordIncomplete: true };

    // Confirmación
    if (next !== confirm) return { passwordMismatch: true };

    // Opcional: regla mínima
    if (next.length < 8) return { passwordWeak: true };

    return null;
  }

  private initialValueJson = '';

  private snapshotForm(): string {
    // Nota: no incluimos password en la comparación (si está vacío)
    const v = this.profileForm.getRawValue();
    const safe = { ...v, password: '' };
    return JSON.stringify(safe);
  }

  get hasChanges(): boolean {
    // Cambio de foto cuenta como cambio
    if (this.selectedFile) return true;

    // Cambio de campos: compara contra el snapshot inicial
    return this.snapshotForm() !== this.initialValueJson;
  }


  // Tu getter para la barrita/porcentaje
  get trainDaysPercent(): string {
    const min = 1;
    const max = 7;
    const value = (this.profileForm.get('trainDays')?.value ?? min) as number;
    const pct = ((value - min) / (max - min)) * 100;
    return pct + '%';
  }

  ngOnInit() {
    this.userService.getMe().subscribe({
      next: (userData) => {
        this.user = userData;

        // Patch SOLO de los campos editables
        this.profileForm.patchValue({
          username: userData.username ?? '',
          email: userData.email ?? '',
          level: (userData.level ?? 'NOVATO') as Level,
          trainDays: (userData.trainDays ?? 3) as TrainDays,
          weight: userData.weight ?? null,
          height: userData.height ?? null,
        });

        // Clave: dejamos el form como “sin cambios”
        this.profileForm.markAsPristine();
        this.profileForm.markAsUntouched();

        // Guardamos snapshot inicial para comparar cambios reales
        this.initialValueJson = this.snapshotForm();
      },
      error: (err) => console.error('Error al cargar usuario:', err),
    });
  }

  onFileSelected(event: any) {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }


  goBack(): void {
    this.router.navigate(['/academia']);
  }

  saveChanges() {
  this.isUploading = true;
  this.saveError = null;
  this.saveOk = false;

  const v = this.profileForm.getRawValue();

  // Payload limpio (solo lo que el backend espera)
  const payload: any = {
    username: v.username,
    email: v.email,
    level: v.level,
    trainDays: v.trainDays,
    weight: v.weight,
    height: v.height,
  };

  // Solo manda cambio de password si el usuario lo intenta
  const wantsPasswordChange =
    !!(v.currentPassword?.trim() || v.newPassword?.trim() || v.confirmPassword?.trim());

  if (wantsPasswordChange) {
    payload.currentPassword = v.currentPassword;
    payload.newPassword = v.newPassword;
  }

  this.userService.updateProfile(payload).subscribe({
    next: (response) => {
      // Actualiza user local
      this.user = { ...this.user, ...response, ...payload };

      const finalizeSuccess = () => {
        // Limpia campos de password (no deben contar como cambios)
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Marca como guardado (sin cambios pendientes)
        this.profileForm.markAsPristine();
        this.profileForm.markAsUntouched();

        // Actualiza snapshot de cambios
        this.initialValueJson = this.snapshotForm();

        // Limpia selección de imagen (si ya se subió)
        this.imagePreview = null;
        this.selectedFile = null;

        this.isUploading = false;
        this.saveOk = true;
        setTimeout(() => (this.saveOk = false), 3000);
      };

      // Si hay foto, súbela después de guardar datos
      if (this.selectedFile) {
        this.userService.uploadPhoto(this.selectedFile).subscribe({
          next: (uploadResponse) => {
            const newUrl =
              uploadResponse.profilePictureUrl || uploadResponse.profile_picture_url;

            if (this.user && newUrl) {
              this.user.profilePictureUrl = newUrl;
              this.user.profile_picture_url = newUrl;
            }

            finalizeSuccess();
          },
          error: (err) => {
            console.error(err);
            // Datos sí se guardaron, foto no
            this.isUploading = false;
            this.saveError = 'Datos guardados, pero falló la imagen.';
            // Aun así, considera el form como guardado
            this.profileForm.markAsPristine();
            this.profileForm.markAsUntouched();
            this.initialValueJson = this.snapshotForm();
          },
        });
      } else {
        finalizeSuccess();
      }
    },
    error: (err) => {
      console.error(err);
      this.isUploading = false;

      // Si el backend manda mensaje, úsalo
      const msg = err?.error?.message || err?.error || null;

      // Mensajes típicos para cambio de password
      if (typeof msg === 'string' && msg.toLowerCase().includes('contraseña')) {
        this.saveError = msg;
      } else {
        this.saveError = 'Error al actualizar el perfil.';
      }
    },
  });
}

}
