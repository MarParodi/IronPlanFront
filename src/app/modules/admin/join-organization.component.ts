import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user/services/user.service';

@Component({
  selector: 'app-join-organization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="join-section">
      <div class="join-card">
        <div class="join-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1>Unirse con código</h1>
        <p class="join-subtitle">
          Si tu organización te compartió un código de invitación, ingrésalo aquí para ver su estructura,
          miembros y retos.
        </p>

        <label class="join-label">
          <span>Código de invitación</span>
          <input
            type="text"
            [(ngModel)]="code"
            (ngModelChange)="onCodeChange()"
            [disabled]="codeVerified()"
            placeholder="Ej: ING-SOFT-02-2026"
            class="join-input"
            autocomplete="off"
          />
        </label>

        <p *ngIf="error()" class="join-error">{{ error() }}</p>

        <div *ngIf="codeVerified() && preview()" class="join-preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            <strong>{{ preview()!.organizationRootName }}</strong>
            <span *ngIf="preview()!.groupName !== preview()!.organizationRootName">
              · {{ preview()!.groupName }}
            </span>
            <span class="join-role">
              Rol: {{ preview()!.membershipRole === 'ADMIN' ? 'Administrador' : 'Miembro' }}
            </span>
            <button type="button" class="join-change" (click)="resetCode()">Cambiar código</button>
          </div>
        </div>

        <div class="join-actions">
          <button
            type="button"
            class="btn-secondary"
            *ngIf="!codeVerified()"
            [disabled]="loading() || !code.trim()"
            (click)="validateCode()">
            {{ loading() ? 'Verificando...' : 'Verificar código' }}
          </button>
          <button
            type="button"
            class="btn-primary"
            *ngIf="codeVerified()"
            [disabled]="joining()"
            (click)="join()">
            {{ joining() ? 'Uniéndote...' : 'Unirme a la organización' }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .join-section {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 8px 0 24px;
      width: 100%;
    }
    .join-card {
      width: 100%;
      max-width: 480px;
      background: #171a1d;
      border: 1px solid rgb(30 41 59);
      border-radius: 16px;
      padding: 32px;
    }
    .join-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: rgba(45,212,191,0.12);
      color: #2dd4bf;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 8px;
    }
    .join-subtitle {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .join-label {
      display: block;
    }
    .join-label span {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    .join-input {
      width: 100%;
      box-sizing: border-box;
      background: #0d0f11;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #e2e8f0;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      outline: none;
    }
    .join-input:focus {
      border-color: rgba(45,212,191,0.5);
    }
    .join-input:disabled {
      color: #2dd4bf;
      border-color: rgba(45,212,191,0.35);
    }
    .join-error {
      margin: 12px 0 0;
      font-size: 13px;
      color: #f87171;
    }
    .join-preview {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(45,212,191,0.08);
      border: 1px solid rgba(45,212,191,0.25);
      color: #99f6e4;
      font-size: 13px;
    }
    .join-preview strong { color: #ccfbf1; }
    .join-role { display: block; margin-top: 4px; font-size: 12px; color: #94a3b8; }
    .join-change {
      display: block;
      margin-top: 4px;
      background: none;
      border: none;
      padding: 0;
      color: #2dd4bf;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
    }
    .join-actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }
    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s;
    }
    .btn-primary {
      background: linear-gradient(180deg, #5eead4, #14b8a6);
      color: #0f172a;
    }
    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class JoinOrganizationComponent {
  @Output() joined = new EventEmitter<void>();

  code = '';
  loading = signal(false);
  joining = signal(false);
  codeVerified = signal(false);
  error = signal<string | null>(null);
  preview = signal<{
    code: string;
    groupId: number;
    groupName: string;
    organizationRootName: string;
    membershipRole?: string;
  } | null>(null);

  constructor(private userService: UserService) {}

  onCodeChange() {
    if (this.codeVerified()) {
      this.codeVerified.set(false);
      this.preview.set(null);
      this.error.set(null);
    }
  }

  resetCode() {
    this.code = '';
    this.codeVerified.set(false);
    this.preview.set(null);
    this.error.set(null);
  }

  validateCode() {
    const trimmed = this.code.trim();
    if (!trimmed) return;

    this.loading.set(true);
    this.error.set(null);

    this.userService.validateOrganizationCode(trimmed).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.codeVerified.set(true);
        this.preview.set(res);
      },
      error: (e) => {
        this.loading.set(false);
        this.codeVerified.set(false);
        this.preview.set(null);
        this.error.set(e?.error?.message || 'Código inválido o expirado');
      }
    });
  }

  join() {
    const trimmed = this.code.trim();
    if (!trimmed || !this.codeVerified()) return;

    this.joining.set(true);
    this.error.set(null);

    this.userService.joinOrganization(trimmed).subscribe({
      next: () => {
        this.joining.set(false);
        this.joined.emit();
      },
      error: (e) => {
        this.joining.set(false);
        this.error.set(e?.error?.message || 'No se pudo completar la unión');
      }
    });
  }
}
