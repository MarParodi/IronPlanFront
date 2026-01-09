import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressService } from '../../workout/services/progress.service';
import { ProgressSummary, WeeklyStats, ExercisePr } from '../../workout/models/progress.models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsComponent implements OnInit {
  summary: ProgressSummary | null = null;
  loading = true;
  error: string | null = null;

  // Tab activa
  activeTab: 'overview' | 'weekly' | 'exercises' = 'overview';

  constructor(
    private progressService: ProgressService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.progressService.getProgressSummary(8).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.error = 'No se pudieron cargar las estadísticas';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: 'overview' | 'weekly' | 'exercises'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  goBack(): void {
    this.router.navigate(['/perfil']);
  }

  // ============ FORMATTERS ============

  formatVolume(kg: number): string {
    if (kg >= 1000000) {
      return `${(kg / 1000000).toFixed(1)}M kg`;
    }
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)} kg`;
  }

  formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // ============ WEEKLY CHART HELPERS ============

  getWeekLabel(week: WeeklyStats): string {
    const start = new Date(week.weekStart);
    const end = new Date(week.weekEnd);
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  }

  getMaxVolume(): number {
    if (!this.summary?.weeklyHistory) return 1;
    const max = Math.max(...this.summary.weeklyHistory.map(w => w.totalVolumeKg));
    return max || 1;
  }

  getVolumeBarHeight(volume: number): number {
    return (volume / this.getMaxVolume()) * 100;
  }

  getMaxWorkouts(): number {
    if (!this.summary?.weeklyHistory) return 1;
    return Math.max(...this.summary.weeklyHistory.map(w => w.workoutsCompleted)) || 1;
  }

  getWorkoutsBarHeight(workouts: number): number {
    return (workouts / this.getMaxWorkouts()) * 100;
  }

  // ============ EXERCISE HELPERS ============

  getMuscleColor(muscle: string): string {
    const colors: { [key: string]: string } = {
      'Pecho': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'Espalda': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Hombros': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Bíceps': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Tríceps': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Piernas': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Cuádriceps': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Glúteos': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
      'Core': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Abdominales': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[muscle] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }

  // ============ CONSISTENCY HELPERS ============

  getDayName(dayOfWeek: number): string {
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return days[dayOfWeek - 1] || '';
  }

  getConsistencyPercentage(): number {
    if (!this.summary?.weeklyHistory || this.summary.weeklyHistory.length === 0) return 0;
    
    // Calcular días con entrenamiento vs días totales en las últimas semanas
    let daysWithWorkout = 0;
    let totalDays = 0;

    this.summary.weeklyHistory.forEach(week => {
      week.dailyBreakdown?.forEach(day => {
        totalDays++;
        if (day.hasWorkout) daysWithWorkout++;
      });
    });

    return totalDays > 0 ? Math.round((daysWithWorkout / totalDays) * 100) : 0;
  }

  // Obtener el volumen total de la semana actual vs semana anterior
  getVolumeChange(): { value: number; isPositive: boolean } {
    if (!this.summary?.weeklyHistory || this.summary.weeklyHistory.length < 2) {
      return { value: 0, isPositive: true };
    }

    const current = this.summary.weeklyHistory[0].totalVolumeKg;
    const previous = this.summary.weeklyHistory[1].totalVolumeKg;

    if (previous === 0) return { value: 0, isPositive: true };

    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  }
}
