import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RetoService } from './services/reto.service';
import { IpaqFormComponent } from './components/ipaq-form.component';
import {
  CATEGORIAS,
  CONSENTIMIENTO_TEXTO,
  IpaqFormData,
  OBJETIVOS,
  ParticipanteCategoria,
} from './models/reto.models';

@Component({
  selector: 'app-reto-inscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IpaqFormComponent],
  template: `
    <div class="min-h-screen bg-ip-page text-ip-primary px-4 py-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 class="text-2xl font-bold">Inscripción al reto</h1>
          <p class="text-sm text-ip-muted mt-1">Completa los 4 pasos para participar en el experimento.</p>
        </header>

        <!-- Stepper -->
        <div class="flex gap-2">
          <div *ngFor="let s of steps; let i = index"
            class="flex-1 h-1 rounded-full"
            [class.bg-teal-500]="step > i"
            [class.bg-ip-border]="step <= i"></div>
        </div>
        <p class="text-xs text-ip-muted">Paso {{ step }} de 4 — {{ steps[step - 1] }}</p>

        <div *ngIf="error" class="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{{ error }}</div>

        <!-- Paso 1 -->
        <section *ngIf="step === 1" class="space-y-4">
          <div class="rounded-xl border border-ip-border p-4 text-sm text-ip-secondary whitespace-pre-line">{{ consentimientoTexto }}</div>
          <label class="flex items-start gap-2 text-sm">
            <input type="checkbox" [(ngModel)]="aceptoConsentimiento" class="mt-1" />
            Acepto el tratamiento de mis datos según lo descrito
          </label>
        </section>

        <!-- Paso 2 -->
        <section *ngIf="step === 2" class="space-y-3">
          <label *ngFor="let obj of objetivos" class="flex items-start gap-3 p-3 rounded-xl border border-ip-border cursor-pointer hover:border-teal-500/40">
            <input type="radio" name="obj" [value]="obj.codigo" [(ngModel)]="objetivoCodigo" class="mt-1" />
            <div>
              <p class="font-medium">{{ obj.label }}</p>
              <p class="text-xs text-ip-muted">{{ obj.desc }}</p>
            </div>
          </label>
          <textarea *ngIf="objetivoCodigo === 'OBJ-7'" [(ngModel)]="objetivoTextoLibre"
            rows="3" placeholder="Describe tu objetivo..."
            class="w-full bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm"></textarea>
        </section>

        <!-- Paso 3 -->
        <section *ngIf="step === 3" class="space-y-3">
          <label *ngFor="let cat of categorias" class="flex items-start gap-3 p-3 rounded-xl border border-ip-border cursor-pointer">
            <input type="radio" name="cat" [value]="cat.value" [(ngModel)]="categoria" class="mt-1" />
            <div>
              <p class="font-medium">{{ cat.label }}</p>
              <p class="text-xs text-ip-muted">{{ cat.desc }}</p>
            </div>
          </label>
        </section>

        <!-- Paso 4 -->
        <section *ngIf="step === 4">
          <app-ipaq-form (formChange)="ipaqData = $event"></app-ipaq-form>
        </section>

        <div class="flex gap-3 pt-4">
          <button *ngIf="step > 1" type="button" (click)="step = step - 1"
            class="px-4 py-2 rounded-xl border border-ip-border text-sm">Atrás</button>
          <button type="button" (click)="next()" [disabled]="saving || !canContinue()"
            class="flex-1 px-4 py-2 rounded-xl bg-teal-500 text-slate-900 font-semibold text-sm disabled:opacity-50">
            {{ step === 4 ? (saving ? 'Guardando...' : 'Finalizar inscripción') : 'Continuar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RetoInscripcionComponent implements OnInit {
  retoId!: number;
  step = 1;
  steps = ['Consentimiento', 'Objetivo', 'Categoría', 'IPAQ pre-test'];
  saving = false;
  error = '';

  aceptoConsentimiento = false;
  objetivoCodigo = 'OBJ-5';
  objetivoTextoLibre = '';
  categoria: ParticipanteCategoria = 'PRINCIPIANTE';
  participanteRetoId: number | null = null;
  ipaqData: IpaqFormData | null = null;

  objetivos = OBJETIVOS;
  categorias = CATEGORIAS;
  consentimientoTexto = CONSENTIMIENTO_TEXTO;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private retoService: RetoService,
  ) {}

  ngOnInit(): void {
    this.retoId = Number(this.route.snapshot.paramMap.get('retoId'));
    this.retoService.getMiEstado(this.retoId).subscribe({
      next: (st) => {
        if (st.completoPretest) {
          this.router.navigate(['/']);
        }
        if (st.participanteRetoId) this.participanteRetoId = st.participanteRetoId;
      },
    });
  }

  canContinue(): boolean {
    switch (this.step) {
      case 1: return this.aceptoConsentimiento;
      case 2: return !!this.objetivoCodigo && (this.objetivoCodigo !== 'OBJ-7' || this.objetivoTextoLibre.trim().length > 0);
      case 3: return !!this.categoria;
      case 4: return !!this.ipaqData;
      default: return false;
    }
  }

  next(): void {
    this.error = '';
    if (this.step < 4) {
      this.step++;
      return;
    }
    this.finalizar();
  }

  private finalizar(): void {
    if (!this.ipaqData) return;
    this.saving = true;

    const inscripcion = {
      categoria: this.categoria,
      objetivoCodigo: this.objetivoCodigo,
      objetivoTextoLibre: this.objetivoCodigo === 'OBJ-7' ? this.objetivoTextoLibre : undefined,
    };

    this.retoService.inscribir(this.retoId, inscripcion).subscribe({
      next: (res) => {
        this.participanteRetoId = res.participanteRetoId;
        this.retoService.consentimiento(this.retoId, res.participanteRetoId).subscribe({
          next: () => this.submitIpaq(res.participanteRetoId),
          error: (e) => this.fail(e),
        });
      },
      error: (e) => this.fail(e),
    });
  }

  private submitIpaq(participanteRetoId: number): void {
    const f = this.ipaqData!;
    this.retoService.submitIpaq(this.retoId, {
      participanteRetoId,
      corte: 'PRE',
      caminataDiasSemana: f.caminataDiasSemana,
      caminataMinDia: f.caminataMinDia,
      moderadaDiasSemana: f.moderadaDiasSemana,
      moderadaMinDia: f.moderadaMinDia,
      vigorosaDiasSemana: f.vigorosaDiasSemana,
      vigorosaMinDia: f.vigorosaMinDia,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/perfil/competencias']);
      },
      error: (e) => this.fail(e),
    });
  }

  private fail(err: unknown): void {
    this.saving = false;
    this.error = (err as { error?: { message?: string } })?.error?.message ?? 'Error al guardar. Intenta de nuevo.';
  }
}
