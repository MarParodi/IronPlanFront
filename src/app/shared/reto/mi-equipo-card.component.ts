import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RetoLeaderboardEntry,
  RetoMyScore,
  buildClosenessMessage,
  ordinalPosition,
  teamMemberCount,
} from '../../core/utils/reto-participant.util';

@Component({
  selector: 'app-mi-equipo-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *ngIf="hasContent" class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden">
      <div class="px-5 py-4 border-b border-ip-border/60">
        <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
          {{ isMemberCompetition ? 'Mi posición' : 'Mi equipo' }}
        </p>
      </div>

      <div class="p-5 space-y-4">
        <div>
          <h3 *ngIf="!isMemberCompetition && myScore?.groupName"
            class="text-xl font-semibold text-ip-primary">
            {{ myScore.groupName }}
          </h3>
          <p *ngIf="positionLabel" class="text-2xl font-bold text-teal-400 mt-1">
            {{ positionLabel }}
          </p>
        </div>

        <p *ngIf="memberCount" class="text-sm text-ip-secondary">
          {{ memberCount }} integrantes en el equipo
        </p>

        <p *ngIf="closenessMessage"
          class="text-sm text-ip-primary rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
          {{ closenessMessage }}
        </p>
      </div>
    </section>
  `,
})
export class MiEquipoCardComponent {
  positionLabel = '';
  closenessMessage = '';
  memberCount: number | null = null;

  private score: RetoMyScore | null = null;
  private entries: RetoLeaderboardEntry[] = [];
  private memberMode = false;

  @Input()
  set isMemberCompetition(value: boolean) {
    this.memberMode = !!value;
    this.recompute();
  }

  get isMemberCompetition(): boolean {
    return this.memberMode;
  }

  @Input()
  set myScore(value: RetoMyScore | null | undefined) {
    this.score = value ?? null;
    this.recompute();
  }

  get myScore(): RetoMyScore | null {
    return this.score;
  }

  @Input()
  set groupLeaderboard(value: RetoLeaderboardEntry[] | null | undefined) {
    this.entries = value ?? [];
    this.recompute();
  }

  get hasContent(): boolean {
    return !!(this.positionLabel || this.closenessMessage || this.score?.groupName);
  }

  private recompute(): void {
    const rank = this.memberMode ? this.score?.memberRank : this.score?.groupRank;

    this.positionLabel = ordinalPosition(rank);
    this.memberCount = this.memberMode
      ? null
      : teamMemberCount(this.entries, this.score?.participantGroupId);
    this.closenessMessage = this.memberMode
      ? ''
      : buildClosenessMessage(this.entries, this.score?.participantGroupId);
  }
}
