import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RetoLeaderboardEntry,
  ordinalPosition,
} from '../../core/utils/reto-participant.util';

@Component({
  selector: 'app-leaderboard-simple',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *ngIf="entries.length" class="rounded-xl border border-ip-border bg-ip-surface overflow-hidden">
      <div class="px-5 py-4 border-b border-ip-border/60">
        <p class="text-xs font-semibold uppercase tracking-wider text-ip-muted">
          {{ title }}
        </p>
        <p class="text-[11px] text-ip-primary0 mt-1">
          Los puntos se usan internamente para calcular la posición de cada equipo.
        </p>
      </div>

      <div class="divide-y divide-ip-border/60">
        <div *ngFor="let entry of entries"
          class="flex items-center gap-4 px-5 py-4"
          [ngClass]="{ 'bg-cyan-500/5': isMine(entry.groupId) }">

          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
            [ngClass]="entry.rank === 1
              ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-ip-page text-ip-muted'">
            {{ entry.rank }}
          </div>

          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-ip-primary0">
              {{ position(entry.rank) }}
            </p>
            <p class="text-base font-semibold truncate"
              [ngClass]="isMine(entry.groupId) ? 'text-cyan-300' : 'text-ip-primary'">
              {{ entry.groupName }}
              <span *ngIf="isMine(entry.groupId)" class="text-cyan-500/70 text-xs font-normal ml-1">
                (tu equipo)
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LeaderboardSimpleComponent {
  @Input() myParticipantGroupId?: number | null;
  @Input() title = 'Posiciones';

  private rows: RetoLeaderboardEntry[] = [];

  @Input()
  set entries(value: RetoLeaderboardEntry[] | null | undefined) {
    this.rows = value ?? [];
  }

  get entries(): RetoLeaderboardEntry[] {
    return this.rows;
  }

  position(rank: number): string {
    return ordinalPosition(rank);
  }

  isMine(groupId: number): boolean {
    return this.myParticipantGroupId != null && groupId === this.myParticipantGroupId;
  }
}
