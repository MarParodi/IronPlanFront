import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FreeActivityService } from '../services/free-activity.service';
import { FreeActivityResponse, getFreeActivityLabel } from '../models/free-activity.models';

@Component({
  standalone: true,
  selector: 'app-free-activity-summary',
  templateUrl: './free-activity-summary.component.html',
  imports: [CommonModule, RouterModule],
})
export class FreeActivitySummaryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private freeActivityService = inject(FreeActivityService);

  activity: FreeActivityResponse | null = null;
  loading = true;
  error: string | null = null;
  showConfetti = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!id || Number.isNaN(id)) {
      this.error = 'Actividad inválida.';
      this.loading = false;
      return;
    }

    this.showConfetti = this.route.snapshot.queryParamMap.get('celebrate') === '1';
    if (this.showConfetti) {
      setTimeout(() => {
        this.showConfetti = false;
      }, 5000);
    }

    this.loadActivity(id);
  }

  private loadActivity(id: number): void {
    this.freeActivityService.getById(id).subscribe({
      next: (data) => {
        this.activity = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el resumen de la actividad.';
        this.loading = false;
      },
    });
  }

  get activityLabel(): string {
    if (!this.activity) return '';
    return getFreeActivityLabel(this.activity.activityType, this.activity.activityTypeOther);
  }

  get durationFormatted(): string {
    const total = this.activity?.durationSeconds ?? 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  onGoHome(): void {
    this.router.navigate(['/']);
  }

  onRegisterAnother(): void {
    this.router.navigate(['/actividad-libre']);
  }
}
