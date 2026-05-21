import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../home/services/admin.service';
 
export interface Exercise {
  id?: number;
  name: string;
  description: string;
  instructions: string;
  primaryMuscle: string;
  secondaryMuscle?: string;
  videoUrl?: string;
  active?: boolean;
}
 
export const MUSCLE_OPTIONS = [
  'Abs', 'Back', 'Biceps', 'Calves', 'Chest',
  'Core', 'Forearms', 'Glutes', 'Hamstrings', 'Hip Flexors',
  'Lats', 'Lower Back', 'Quads', 'Rear Delts', 'Shoulders',
  'Traps', 'Triceps', 'Upper Back'
];
 
@Component({
  selector: 'app-exercise-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-overlay" (click)="onCancel()">
  <div class="modal" (click)="$event.stopPropagation()">
 
    <div class="modal-header">
      <h2>{{ form.id ? 'Editar ejercicio' : 'Nuevo ejercicio' }}</h2>
      <button class="modal-close" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
 
    <div class="modal-body">
 
      <!-- Nombre -->
      <div class="field">
        <label class="field-label">Nombre <span class="required">*</span></label>
        <input [(ngModel)]="form.name" type="text" class="field-input"
               placeholder="Ej: Bench Press"/>
      </div>
 
      <!-- Descripción -->
      <div class="field">
        <label class="field-label">Descripción <span class="required">*</span></label>
        <textarea [(ngModel)]="form.description" class="field-input field-textarea" rows="2"
                  placeholder="Descripción breve del ejercicio..."></textarea>
      </div>
 
      <!-- Instrucciones -->
      <div class="field">
        <label class="field-label">Instrucciones <span class="required">*</span></label>
        <textarea [(ngModel)]="form.instructions" class="field-input field-textarea" rows="3"
                  placeholder="Paso a paso de cómo ejecutar el ejercicio..."></textarea>
      </div>
 
      <!-- Músculos -->
      <div class="row2">
        <div class="field">
          <label class="field-label">Músculo principal <span class="required">*</span></label>
          <select [(ngModel)]="form.primaryMuscle" class="field-input">
            <option value="">Selecciona</option>
            <option *ngFor="let m of muscles" [value]="m">{{ m }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">
            Músculo secundario
            <span class="field-hint">— opcional</span>
          </label>
          <input [(ngModel)]="form.secondaryMuscle" type="text" class="field-input"
                 placeholder="Ej: Triceps"/>
        </div>
      </div>
 
      <!-- Video -->
      <div class="field">
        <label class="field-label">
          URL de video / GIF
          <span class="field-hint">— opcional</span>
        </label>
        <input [(ngModel)]="form.videoUrl" type="text" class="field-input"
               placeholder="https://..."/>
      </div>
 
      <p *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</p>
 
    </div>
 
    <div class="modal-footer">
      <button class="btn-secondary" (click)="onCancel()" [disabled]="saving">Cancelar</button>
      <button class="btn-primary" (click)="onSave()" [disabled]="saving">
        {{ saving ? 'Guardando...' : (form.id ? 'Guardar cambios' : 'Crear ejercicio') }}
      </button>
    </div>
 
  </div>
</div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal {
      background: #171a1d; border: 1px solid rgba(255,255,255,0.09);
      border-radius: 18px; width: 100%; max-width: 520px;
      max-height: 88vh; display: flex; flex-direction: column;
      box-shadow: 0 25px 60px rgba(0,0,0,0.7);
    }
    .modal-header {
      padding: 18px 20px 0; display: flex;
      align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .modal-header h2 { font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0; }
    .modal-close {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: 7px; background: transparent; border: none; color: #64748b; cursor: pointer;
    }
    .modal-close:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
    .modal-body {
      padding: 16px 20px; overflow-y: auto; flex: 1;
      display: flex; flex-direction: column; gap: 14px;
    }
    .modal-footer {
      padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .field-hint { font-size: 11px; color: #475569; font-weight: 400; }
    .required { color: #f87171; }
    .field-input {
      background: #0f1214; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #e2e8f0; padding: 8px 11px;
      font-size: 13px; outline: none; transition: border-color 0.15s; font-family: inherit;
    }
    .field-input:focus { border-color: rgba(45,212,191,0.5); }
    .field-input::placeholder { color: #334155; }
    .field-input option { background: #1b1f23; }
    .field-textarea { resize: vertical; min-height: 60px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn-primary {
      padding: 8px 16px; border-radius: 9px;
      background: linear-gradient(to bottom, #5eead4, #2dd4bf);
      color: #0f172a; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer; transition: filter 0.15s;
    }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: 8px 16px; border-radius: 9px;
      background: rgba(255,255,255,0.05); color: #cbd5e1;
      font-size: 13px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
    }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg {
      font-size: 12px; color: #fca5a5;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px; padding: 8px 12px; margin: 0;
    }
  `]
})
export class ExerciseFormComponent implements OnInit {
 
  @Input() exercise?: Exercise;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
 
  muscles  = MUSCLE_OPTIONS;
  saving   = false;
  errorMsg = '';
 
  form: Exercise = {
    name: '', description: '', instructions: '',
    primaryMuscle: '', secondaryMuscle: '', videoUrl: ''
  };
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void {
    if (this.exercise) {
      this.form = { ...this.exercise };
    }
  }
 
  onSave() {
    this.errorMsg = '';
    if (!this.form.name.trim())         { this.errorMsg = 'El nombre es obligatorio'; return; }
    if (!this.form.description.trim())  { this.errorMsg = 'La descripción es obligatoria'; return; }
    if (!this.form.instructions.trim()) { this.errorMsg = 'Las instrucciones son obligatorias'; return; }
    if (!this.form.primaryMuscle)       { this.errorMsg = 'Selecciona el músculo principal'; return; }
 
    this.saving = true;
    const payload = {
      name:            this.form.name.trim(),
      description:     this.form.description.trim(),
      instructions:    this.form.instructions.trim(),
      primaryMuscle:   this.form.primaryMuscle,
      secondaryMuscle: this.form.secondaryMuscle?.trim() || undefined,
      videoUrl:        this.form.videoUrl?.trim() || undefined,
    };
 
    const req = this.form.id
      ? this.adminService.updateExercise(this.form.id, payload)
      : this.adminService.createExercise(payload);
 
    req.subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err?.error?.message || 'Error al guardar el ejercicio';
      }
    });
  }
 
  onCancel() { this.cancelled.emit(); }
}
 