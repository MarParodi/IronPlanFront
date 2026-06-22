import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RetoPendingService } from '../services/reto-pending.service';
import { RetoService } from '../services/reto.service';
import { IpaqFormComponent } from './ipaq-form.component';
import { SusFormComponent } from './sus-form.component';
import { IpaqFormData, ParticipanteStatus, RetoResumen } from '../models/reto.models';

@Component({
  selector: 'app-reto-pending-overlay',
  standalone: true,
  imports: [CommonModule, RouterModule, IpaqFormComponent, SusFormComponent],
  template: `
    <!-- Banner inscripción pendiente -->
    <div *ngIf="reto && estado && pending.needsInscripcion(estado) && !showModal"
      class="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 text-center text-sm">
      <span>Completa tu inscripción al reto <strong>{{ reto.nombre }}</strong> (IPAQ pre-test obligatorio).</span>
      <a [routerLink]="['/reto', reto.id, 'inscripcion']" class="ml-2 text-teal-400 font-semibold underline">Inscribirme</a>
    </div>

    <!-- Modal bloqueante post-test / SUS -->
    <div *ngIf="showModal" class="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div class="bg-ip-surface border border-ip-border rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold">{{ modalTitle }}</h2>
        <p class="text-sm text-ip-muted">{{ modalDesc }}</p>

        <app-ipaq-form *ngIf="modalType === 'ipaq'" (formChange)="ipaqData = $event"></app-ipaq-form>
        <app-sus-form *ngIf="modalType === 'sus'" #susForm (answersChange)="susAnswers = $event"></app-sus-form>

        <p *ngIf="error" class="text-sm text-red-300">{{ error }}</p>

        <button type="button" (click)="submitModal()" [disabled]="saving || !canSubmitModal()"
          class="w-full py-3 rounded-xl bg-teal-500 text-slate-900 font-semibold disabled:opacity-50">
          {{ saving ? 'Enviando...' : 'Enviar respuestas' }}
        </button>
      </div>
    </div>
  `,
})
export class RetoPendingOverlayComponent implements OnInit {
  @ViewChild('susForm') susForm?: SusFormComponent;

  reto: RetoResumen | null = null;
  estado: ParticipanteStatus | null = null;
  showModal = false;
  modalType: 'ipaq' | 'sus' | null = null;
  modalTitle = '';
  modalDesc = '';
  ipaqData: IpaqFormData | null = null;
  susAnswers: Record<number, number> = {};
  saving = false;
  error = '';

  constructor(
    public pending: RetoPendingService,
    private retoService: RetoService,
  ) {}

  ngOnInit(): void {
    this.pending.refresh();
    this.pending.reto$.subscribe(r => this.reto = r);
    this.pending.estado$.subscribe(st => {
      this.estado = st;
      this.updateModal(st);
    });
  }

  private updateModal(st: ParticipanteStatus | null): void {
    if (!st || !this.reto) {
      this.showModal = false;
      return;
    }
    if (this.pending.needsPosttestIpaq(st)) {
      this.showModal = true;
      this.modalType = 'ipaq';
      this.modalTitle = 'IPAQ post-test';
      this.modalDesc = 'Antes de ver tus resultados del reto, completa el cuestionario de actividad física (últimos 7 días).';
      return;
    }
    if (this.pending.needsSus(st)) {
      this.showModal = true;
      this.modalType = 'sus';
      this.modalTitle = 'Encuesta de usabilidad (SUS)';
      this.modalDesc = 'Tu opinión sobre Iron Plan es importante para la investigación. 10 preguntas, ~2 minutos.';
      return;
    }
    this.showModal = false;
  }

  canSubmitModal(): boolean {
    if (this.modalType === 'ipaq') return !!this.ipaqData;
    if (this.modalType === 'sus') return this.susForm?.isComplete() ?? false;
    return false;
  }

  submitModal(): void {
    if (!this.reto || !this.estado?.participanteRetoId) return;
    this.saving = true;
    this.error = '';

    if (this.modalType === 'ipaq' && this.ipaqData) {
      const f = this.ipaqData;
      this.retoService.submitIpaq(this.reto.id, {
        participanteRetoId: this.estado.participanteRetoId,
        corte: 'POST',
        caminataDiasSemana: f.caminataDiasSemana,
        caminataMinDia: f.caminataMinDia,
        moderadaDiasSemana: f.moderadaDiasSemana,
        moderadaMinDia: f.moderadaMinDia,
        vigorosaDiasSemana: f.vigorosaDiasSemana,
        vigorosaMinDia: f.vigorosaMinDia,
      }).subscribe({
        next: () => { this.saving = false; this.pending.refresh(); },
        error: () => { this.saving = false; this.error = 'No se pudo guardar el IPAQ.'; },
      });
      return;
    }

    if (this.modalType === 'sus' && this.susForm?.isComplete()) {
      const a = this.susForm.getAnswersArray();
      this.retoService.submitSus(this.reto.id, {
        participanteRetoId: this.estado.participanteRetoId,
        susQ1: a[0], susQ2: a[1], susQ3: a[2], susQ4: a[3], susQ5: a[4],
        susQ6: a[5], susQ7: a[6], susQ8: a[7], susQ9: a[8], susQ10: a[9],
      }).subscribe({
        next: () => { this.saving = false; this.pending.refresh(); },
        error: () => { this.saving = false; this.error = 'No se pudo guardar la encuesta SUS.'; },
      });
    }
  }
}
