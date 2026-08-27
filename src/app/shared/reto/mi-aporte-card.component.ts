import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RetoMyScore,
  buildContributionMessages,
} from '../../core/utils/reto-participant.util';

@Component({
  selector: 'app-mi-aporte-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden">
      <div class="px-5 py-4 border-b border-ip-border/60">
        <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
          {{ isMemberCompetition ? 'Mi aporte al reto' : 'Mi aporte al equipo' }}
        </p>
      </div>

      <div class="p-5 space-y-4">
        <div class="flex items-end gap-2">
          <h3 class="text-4xl font-bold text-cyan-400 leading-none">
            {{ (myScore?.individualScore ?? 0) | number:'1.0-0' }}
          </h3>
          <span class="text-sm text-ip-muted pb-1">
            {{ (metricLabel || 'puntos') | lowercase }}
          </span>
        </div>

        <div *ngIf="messages.length" class="space-y-2">
          <p *ngFor="let message of messages"
            class="text-sm text-cyan-200/90 rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-2">
            {{ message }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class MiAporteCardComponent {
  @Input() metricLabel?: string;
  @Input() isMemberCompetition = false;

  messages: string[] = [];

  private currentScore: RetoMyScore | null = null;

  @Input()
  set myScore(value: RetoMyScore | null | undefined) {
    this.currentScore = value ?? null;
    this.messages = buildContributionMessages(this.currentScore);
  }

  get myScore(): RetoMyScore | null {
    return this.currentScore;
  }
}
