import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SUS_PREGUNTAS } from '../models/reto.models';

@Component({
  selector: 'app-sus-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
      <p class="text-sm text-ip-muted">
        Escala del 1 (totalmente en desacuerdo) al 5 (totalmente de acuerdo).
      </p>
      <div *ngFor="let q of preguntas" class="rounded-xl border border-ip-border p-4">
        <p class="text-sm text-ip-primary mb-3">{{ q.id }}. {{ q.texto }}</p>
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let v of [1,2,3,4,5]" type="button"
            (click)="setAnswer(q.id, v)"
            [disabled]="readonly"
            class="w-10 h-10 rounded-lg border text-sm font-semibold transition"
            [class.bg-teal-500]="answers[q.id] === v"
            [class.text-slate-900]="answers[q.id] === v"
            [class.border-teal-500]="answers[q.id] === v"
            [class.border-ip-border]="answers[q.id] !== v"
            [class.text-ip-muted]="answers[q.id] !== v">
            {{ v }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SusFormComponent {
  @Input() readonly = false;
  @Output() answersChange = new EventEmitter<Record<number, number>>();

  preguntas = SUS_PREGUNTAS;
  answers: Record<number, number> = {};

  setAnswer(id: number, value: number): void {
    this.answers[id] = value;
    this.answersChange.emit({ ...this.answers });
  }

  isComplete(): boolean {
    return SUS_PREGUNTAS.every(q => this.answers[q.id] >= 1 && this.answers[q.id] <= 5);
  }

  getAnswersArray(): number[] {
    return SUS_PREGUNTAS.map(q => this.answers[q.id] ?? 0);
  }
}
