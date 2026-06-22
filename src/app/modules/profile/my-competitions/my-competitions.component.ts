import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompetitionResponse, ProfileService } from '../services/profile.service';
import { RetoService } from '../../reto/services/reto.service';
import { ParticipanteStatus, RetoResumen } from '../../reto/models/reto.models';



@Component({
  selector: 'app-my-competitions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-competitions.component.html',
  styleUrls: ['./my-competitions.component.css']
})
export class MyCompetitionsComponent implements OnInit {

constructor(private profileService: ProfileService, private retoService: RetoService) {}

  competitions:  CompetitionResponse[] = [];
  filtered:      CompetitionResponse[] = [];
  loading  = true;
  errorMsg = '';
  activeTab: 'all' | 'ACTIVE' | 'FINISHED' = 'all';

  retoActivo: RetoResumen | null = null;
  retoEstado: ParticipanteStatus | null = null;
 
 
 
  ngOnInit(): void {
    this.load();
    this.retoService.getRetosActivos().subscribe({
      next: (retos) => {
        this.retoActivo = retos[0] ?? null;
        if (this.retoActivo) {
          this.retoService.getMiEstado(this.retoActivo.id).subscribe({
            next: (st) => this.retoEstado = st,
          });
        }
      },
    });
  }
 
  load() {
  this.loading = true;
  this.profileService.getMyCompetitions().subscribe({
    next: (data) => {
      this.competitions = data;
      this.applyTab(this.activeTab);
      this.loading = false;
    },
    error: () => {
      this.errorMsg = 'No se pudieron cargar tus competencias.';
      this.loading  = false;
    }
  });
}
 
  applyTab(tab: 'all' | 'ACTIVE' | 'FINISHED') {
    this.activeTab = tab;
    this.filtered  = tab === 'all'
      ? this.competitions
      : this.competitions.filter(c => c.status === tab);
  }
 
  get activeCount():   number { return this.competitions.filter(c => c.status === 'ACTIVE').length; }
  get finishedCount(): number { return this.competitions.filter(c => c.status === 'FINISHED').length; }
 
  typeClass(type: string): string {
    return ({ RANKING: 'badge-ranking', CHALLENGE: 'badge-challenge', VERSUS: 'badge-versus' })[type] ?? '';
  }
 
  metricLabel(m: string): string {
    return ({
      SESSIONS: 'Sesiones', ACTIVE_MINUTES: 'Minutos activos', WORKOUTS_COUNT: 'Entrenamientos',
      VOLUME_TOTAL: 'Volumen total (kg)', FREE_ACTIVITY_COUNT: 'Actividades libres', FREE_ACTIVITY_KM: 'Km actividad libre',
    })[m] ?? m;
  }

  metricIcon(m: string): string {
    return ({
      SESSIONS: '🏋️', ACTIVE_MINUTES: '⏱️', WORKOUTS_COUNT: '🔥', VOLUME_TOTAL: '💪',
      FREE_ACTIVITY_COUNT: '🏃', FREE_ACTIVITY_KM: '📍',
    })[m] ?? '📊';
  }
 
  scopeLabel(s: string): string {
    return ({ EMPRESA: 'Organización', FACULTAD: 'Facultad', CARRERA: 'Carrera', GRUPO: 'Grupo' })[s] ?? s;
  }
 
  statusLabel(s: string): string {
    return ({ ACTIVE: 'En curso', FINISHED: 'Finalizada', DRAFT: 'Borrador' })[s] ?? s;
  }
}