import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaIpaq, IpaqFormData } from '../models/reto.models';

@Component({
  selector: 'app-ipaq-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 text-sm">
      <p class="text-ip-muted">Piensa en la actividad física que hiciste durante los <strong>últimos 7 días</strong>.</p>

      <!-- Vigorosa -->
      <section class="rounded-xl border border-ip-border p-4 space-y-3">
        <h3 class="font-semibold text-ip-primary">Actividad vigorosa</h3>
        <p class="text-xs text-ip-muted">Esfuerzo intenso, respiración acelerada (correr, natación rápida, etc.)</p>
        <label class="flex items-center gap-2">
          <input type="checkbox" [(ngModel)]="form.vigorosaRealizo" (ngModelChange)="emitChange()" [disabled]="readonly" />
          Realicé actividad vigorosa
        </label>
        <div class="grid grid-cols-2 gap-3" *ngIf="form.vigorosaRealizo">
          <div>
            <label class="text-xs text-ip-muted">Días a la semana (0–7)</label>
            <input type="number" min="0" max="7" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.vigorosaDiasSemana" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
          <div>
            <label class="text-xs text-ip-muted">Minutos por día</label>
            <input type="number" min="0" max="720" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.vigorosaMinDia" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
        </div>
      </section>

      <!-- Moderada -->
      <section class="rounded-xl border border-ip-border p-4 space-y-3">
        <h3 class="font-semibold text-ip-primary">Actividad moderada</h3>
        <label class="flex items-center gap-2">
          <input type="checkbox" [(ngModel)]="form.moderadaRealizo" (ngModelChange)="emitChange()" [disabled]="readonly" />
          Realicé actividad moderada
        </label>
        <div class="grid grid-cols-2 gap-3" *ngIf="form.moderadaRealizo">
          <div>
            <label class="text-xs text-ip-muted">Días a la semana</label>
            <input type="number" min="0" max="7" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.moderadaDiasSemana" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
          <div>
            <label class="text-xs text-ip-muted">Minutos por día</label>
            <input type="number" min="0" max="720" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.moderadaMinDia" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
        </div>
      </section>

      <!-- Caminata -->
      <section class="rounded-xl border border-ip-border p-4 space-y-3">
        <h3 class="font-semibold text-ip-primary">Caminata</h3>
        <label class="flex items-center gap-2">
          <input type="checkbox" [(ngModel)]="form.caminataRealizo" (ngModelChange)="emitChange()" [disabled]="readonly" />
          Realicé caminata
        </label>
        <div class="grid grid-cols-2 gap-3" *ngIf="form.caminataRealizo">
          <div>
            <label class="text-xs text-ip-muted">Días a la semana</label>
            <input type="number" min="0" max="7" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.caminataDiasSemana" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
          <div>
            <label class="text-xs text-ip-muted">Minutos por día</label>
            <input type="number" min="0" max="720" class="w-full mt-1 bg-ip-input border border-ip-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" [(ngModel)]="form.caminataMinDia" (ngModelChange)="emitChange()" [disabled]="readonly" />
          </div>
        </div>
      </section>

      <div *ngIf="metPreview !== null" class="rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-3">
        <p class="text-xs uppercase text-teal-400 font-semibold">Estimación IPAQ</p>
        <p class="text-lg font-bold text-ip-primary">{{ metPreview | number:'1.0-0' }} MET-min/semana</p>
        <p class="text-sm text-ip-muted">Nivel estimado: <strong>{{ categoriaPreview }}</strong></p>
        <p *ngIf="esOutlierPreview" class="text-xs text-amber-400 mt-1">⚠ Valores inusualmente altos — serán marcados para revisión.</p>
      </div>
    </div>
  `,
})
export class IpaqFormComponent implements OnChanges {
  @Input() readonly = false;
  @Input() initial: Partial<IpaqFormData> | null = null;
  @Output() formChange = new EventEmitter<IpaqFormData>();

  form: IpaqFormData = this.emptyForm();
  metPreview: number | null = null;
  categoriaPreview: CategoriaIpaq | '' = '';
  esOutlierPreview = false;

  ngOnChanges(): void {
    if (this.initial) {
      this.form = { ...this.emptyForm(), ...this.initial };
      this.emitChange();
    }
  }

  emptyForm(): IpaqFormData {
    return {
      vigorosaRealizo: false, vigorosaDiasSemana: 0, vigorosaMinDia: 0,
      moderadaRealizo: false, moderadaDiasSemana: 0, moderadaMinDia: 0,
      caminataRealizo: false, caminataDiasSemana: 0, caminataMinDia: 0,
    };
  }

  emitChange(): void {
    const payload = this.normalized();
    this.calcPreview(payload);
    this.formChange.emit(payload);
  }

  normalized(): IpaqFormData {
    const f = { ...this.form };
    if (!f.vigorosaRealizo) { f.vigorosaDiasSemana = 0; f.vigorosaMinDia = 0; }
    if (!f.moderadaRealizo) { f.moderadaDiasSemana = 0; f.moderadaMinDia = 0; }
    if (!f.caminataRealizo) { f.caminataDiasSemana = 0; f.caminataMinDia = 0; }
    return f;
  }

  private calcPreview(f: IpaqFormData): void {
    const metV = 8.0 * f.vigorosaMinDia * f.vigorosaDiasSemana;
    const metM = 4.0 * f.moderadaMinDia * f.moderadaDiasSemana;
    const metC = 3.3 * f.caminataMinDia * f.caminataDiasSemana;
    const total = metV + metM + metC;
    this.metPreview = total;
    this.categoriaPreview = total < 600 ? 'BAJO' : total < 3000 ? 'MODERADO' : 'ALTO';
    this.esOutlierPreview =
      f.vigorosaMinDia * f.vigorosaDiasSemana > 960 ||
      f.moderadaMinDia * f.moderadaDiasSemana > 960 ||
      f.caminataMinDia * f.caminataDiasSemana > 960;
  }
}
