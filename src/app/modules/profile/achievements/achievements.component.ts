import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { Achievement, AchievementStats } from '../models/achievement.models';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent implements OnInit {
  achievements: Achievement[] = [];
  stats: AchievementStats | null = null;
  loading = true;
  error: string | null = null;

  // Modal de detalle
  selectedAchievement: Achievement | null = null;
  modalOpen = false;

  // Filtro por categoría
  selectedCategory: string | null = null;
  categories = [
    { key: null, label: 'Todas' },
    { key: 'workout', label: 'Entrenamiento' },
    { key: 'creator', label: 'Creador' },
    { key: 'xp', label: 'XP' }
  ];

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Cargar achievements y stats en paralelo
    this.profileService.getAchievements().subscribe({
      next: (achievements) => {
        this.achievements = achievements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando hazañas:', err);
        this.error = 'No se pudieron cargar las hazañas';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.profileService.getAchievementStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredAchievements(): Achievement[] {
    if (!this.selectedCategory) {
      return this.achievements;
    }
    return this.achievements.filter(a => a.category === this.selectedCategory);
  }

  get unlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  selectCategory(category: string | null): void {
    this.selectedCategory = category;
    this.cdr.markForCheck();
  }

  openModal(achievement: Achievement): void {
    this.selectedAchievement = achievement;
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedAchievement = null;
    this.cdr.markForCheck();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/perfil']);
  }

  // Iconos según el tipo
  getIconClass(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'trophy': 'text-amber-400',
      'medal': 'text-amber-400',
      'star': 'text-yellow-400',
      'crown': 'text-yellow-500',
      'fire': 'text-orange-500',
      'bolt': 'text-teal-400',
      'pencil': 'text-violet-400',
      'target': 'text-emerald-400'
    };
    return iconMap[icon] || 'text-slate-400';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'workout': 'Entrenamiento',
      'creator': 'Creador',
      'xp': 'XP',
      'social': 'Social'
    };
    return labels[category] || category;
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'workout': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'creator': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'xp': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'social': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}
