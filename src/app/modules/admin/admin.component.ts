import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../home/services/admin.service';
import { UserService } from '../user/services/user.service';
import { OrgTreeComponent, GroupTreeNode } from './org-three.component';
import { OrgCascadeFormComponent } from './org-cascade-form.component';
import { CompetitionFormComponent } from './competition-form.component';
import { InvitationFormComponent } from './invitation-form.component';
import { ExerciseFormComponent, Exercise, MUSCLE_OPTIONS } from './exercise-form.component';
import { CompetitionDetailModalComponent } from './competition-detail.component';
import { AdminRetoExperimentoComponent } from '../reto/admin-reto-experimento.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OrgTreeComponent, OrgCascadeFormComponent, CompetitionFormComponent, InvitationFormComponent, ExerciseFormComponent, CompetitionDetailModalComponent, AdminRetoExperimentoComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  //propiedades modal detalle competencia
  showCompetitionDetailModal = false;
  selectedCompetitionId?: number;
 
  activeSection: 'grupos' | 'invitaciones' | 'competencias' | 'ejercicios' | 'experimento' = 'grupos';
 
  // ─── GRUPOS ───────────────────────────────────────────────
  groups: any[] = [];
  groupTree: GroupTreeNode[] = [];
  loadingGroups = false;
  loadingTree = false;
  groupTypeFilter = '';
  groupActiveFilter = '';
  showGroupModal = false;
  editingGroup: any = null;
  savingGroup = false;
  availableParents: any[] = [];
  leafGroups: any[] = [];


  //Propiedades para ejercicio
  exercises: Exercise[]         = [];
  filteredExercises: Exercise[] = [];
  loadingExercises              = false;
  showExerciseModal             = false;
  editingExercise?: Exercise;
  exerciseSearch                = '';
  exerciseMuscleFilter          = '';
  exerciseStatusFilter          = '';
  muscleOptions                 = MUSCLE_OPTIONS;
 
  // Cascade form (crear/editar org completa)
  showCascadeModal = false;
  cascadeEditId?: number;
 
  groupForm = {
    name: '',
    groupType: '',
    parentId: null as number | null,
    code: '',
    organizationKind: ''
  };
 
  readonly orgKindConfig: Record<string, {
    level1: string; level2: string; level3: string; level4: string;
  }> = {
    UNIVERSIDAD: { level1: 'Universidad', level2: 'Facultad',     level3: 'Carrera',  level4: 'Grupo'   },
    EMPRESA:     { level1: 'Empresa',     level2: 'Departamento', level3: 'Área',     level4: 'Equipo'  },
    GIMNASIO:    { level1: 'Gimnasio',    level2: 'Sucursal',     level3: 'Clase',    level4: 'Grupo'   },
    INSTITUCION: { level1: 'Institución', level2: 'División',     level3: 'Programa', level4: 'Sección' },
  };
 
  get currentKindConfig() {
    return this.orgKindConfig[this.groupForm.organizationKind]
      ?? this.orgKindConfig['UNIVERSIDAD'];
  }
 
  // ─── INVITACIONES ─────────────────────────────────────────
  invitations: any[] = [];
  loadingInvitations = false;
  showInvitationModal = false;
 
  // ─── COMPETENCIAS ─────────────────────────────────────────
  competitions: any[] = [];
  loadingCompetitions = false;
  competitionStatusFilter = '';
  competitionTypeFilter = '';
  showCompetitionModal = false;
 
  // ─── TOAST ────────────────────────────────────────────────
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

  /** Creador de la organización: puede editar grupos, invitaciones y competencias */
  canManage = false;
  /** Admin global de plataforma: acceso al catálogo de ejercicios */
  isGlobalAdmin = false;
  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (me) => {
        this.isGlobalAdmin = me?.role === 'ADMIN';
        this.canManage = !!me?.canManageOrganization;

        if (!this.canManage && !this.isGlobalAdmin) {
          this.router.navigate(['/grupos/mis-grupos']);
          return;
        }
        this.loadGroups();
      },
      error: () => this.router.navigate(['/grupos/mis-grupos'])
    });
  }

  setSection(section: 'grupos' | 'invitaciones' | 'competencias' | 'ejercicios' | 'experimento') {
    this.activeSection = section;
    if (section === 'grupos')       this.loadGroups();
    if (section === 'invitaciones') this.loadInvitations();
    if (section === 'competencias') this.loadCompetitions();
    if (section === 'ejercicios') this.loadExercises();
  }
 
  // ─── GRUPOS ───────────────────────────────────────────────
 
  loadGroups() {
    this.loadingGroups = true;
    this.loadingTree = true;
 
    this.adminService.getGroups({
      type: this.groupTypeFilter,
      active: this.groupActiveFilter
    }).subscribe({
      next: (data) => {
        this.groups = data;
        this.leafGroups = data.filter((g: any) => g.groupType === 'GRUPO');
        this.loadingGroups = false;
      },
      error: () => { this.loadingGroups = false; }
    });
 
    this.adminService.getGroupTree().subscribe({
      next: (data) => { this.groupTree = data; this.loadingTree = false; },
      error: () => { this.loadingTree = false; }
    });
  }
 
  openCreateGroup() {
    this.cascadeEditId = undefined;
    this.showCascadeModal = true;
  }
 
  onTreeEdit(node: GroupTreeNode) {
    if (node.groupType === 'EMPRESA') {
      this.cascadeEditId = node.id;
      this.showCascadeModal = true;
    } else {
      this.editGroup(node);
    }
  }
 
  onTreeDeactivate(node: GroupTreeNode) { this.deactivateGroup(node); }
 
  onCascadeSaved() {
    this.showCascadeModal = false;
    this.loadGroups();
    this.showToast('Organización guardada', 'success');
  }
 
  onCascadeCancelled() { this.showCascadeModal = false; }
 
  editGroup(g: any) {
    this.editingGroup = g;
    this.groupForm = {
      name: g.name,
      groupType: g.groupType,
      parentId: g.parentId ?? null,
      code: g.code,
      organizationKind: g.organizationKind ?? ''
    };
    this.loadAvailableParents();
    this.showGroupModal = true;
  }
 
  loadAvailableParents() {
    this.adminService.getGroups({ active: 'true' }).subscribe({
      next: (data) => {
        this.availableParents = data.filter((g: any) => g.groupType !== 'GRUPO');
      }
    });
  }
 
  saveGroup() {
    if (!this.groupForm.name || !this.groupForm.groupType || !this.groupForm.code) {
      this.showToast('Completa nombre, tipo y código', 'error');
      return;
    }
    if (this.groupForm.groupType === 'EMPRESA' && !this.groupForm.organizationKind) {
      this.showToast('Selecciona el tipo de organización', 'error');
      return;
    }
 
    this.savingGroup = true;
    const payload = {
      ...this.groupForm,
      organizationKind: this.groupForm.organizationKind || undefined,
      parentId: this.groupForm.parentId || undefined
    };
 
    const req = this.editingGroup
      ? this.adminService.updateGroup(this.editingGroup.id, payload)
      : this.adminService.createGroup(payload);
 
    req.subscribe({
      next: () => {
        this.savingGroup = false;
        this.closeGroupModal();
        this.loadGroups();
        this.showToast(this.editingGroup ? 'Grupo actualizado' : 'Grupo creado', 'success');
      },
      error: (err) => {
        this.savingGroup = false;
        this.showToast(err?.error?.message || 'Error al guardar grupo', 'error');
      }
    });
  }
 
  deactivateGroup(g: any) {
    if (!confirm(`¿Desactivar el grupo "${g.name}"?`)) return;
    this.adminService.deactivateGroup(g.id).subscribe({
      next: () => { this.loadGroups(); this.showToast('Grupo desactivado', 'success'); },
      error: () => this.showToast('Error al desactivar', 'error')
    });
  }
 
  closeGroupModal() { this.showGroupModal = false; }
 
  getGroupTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      EMPRESA: 'Empresa', FACULTAD: 'Facultad', CARRERA: 'Carrera', GRUPO: 'Grupo'
    };
    return labels[type] ?? type;
  }
 
  getGroupTypeClass(type: string): string {
    const classes: Record<string, string> = {
      EMPRESA: 'badge-empresa', FACULTAD: 'badge-facultad',
      CARRERA: 'badge-carrera', GRUPO: 'badge-grupo'
    };
    return classes[type] ?? '';
  }
 
  // ─── INVITACIONES ─────────────────────────────────────────
 
  loadInvitations() {
    this.loadingInvitations = true;
    this.adminService.getInvitations().subscribe({
      next: (data) => { this.invitations = data; this.loadingInvitations = false; },
      error: () => { this.loadingInvitations = false; this.showToast('Error cargando invitaciones', 'error'); }
    });
  }
 
  openCreateInvitation() {
    this.showInvitationModal = true;
  }
 
  // El componente ya muestra el código generado internamente.
  // Solo refrescamos la lista, sin cerrar el modal.
  onInvitationSaved() {
    this.loadInvitations();
    this.showToast('Código generado', 'success');
  }
 
  // El usuario cierra el modal manualmente (botón Cerrar o X).
  onInvitationCancelled() {
    this.showInvitationModal = false;
    this.loadInvitations(); // refrescar por si generó alguno antes de cerrar
  }
 
  deactivateInvitation(inv: any) {
    if (!confirm(`¿Desactivar el código "${inv.code}"?`)) return;
    this.adminService.deactivateInvitation(inv.id).subscribe({
      next: () => { this.loadInvitations(); this.showToast('Invitación desactivada', 'success'); },
      error: () => this.showToast('Error al desactivar', 'error')
    });
  }
 
  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => this.showToast('Código copiado', 'success'));
  }
 
  // ─── COMPETENCIAS ─────────────────────────────────────────
 
  loadCompetitions() {
    this.loadingCompetitions = true;
    this.adminService.getCompetitions({
      status: this.competitionStatusFilter,
      type: this.competitionTypeFilter
    }).subscribe({
      next: (data) => { this.competitions = data; this.loadingCompetitions = false; },
      error: () => { this.loadingCompetitions = false; this.showToast('Error cargando competencias', 'error'); }
    });
  }
 
  openCreateCompetition() {
    this.showCompetitionModal = true;
  }
 
  onCompetitionSaved() {
    this.showCompetitionModal = false;
    this.loadCompetitions();
    this.showToast('Competencia creada', 'success');
  }
 
  onCompetitionCancelled() {
    this.showCompetitionModal = false;
  }
 
  activateCompetition(c: any) {
    this.adminService.activateCompetition(c.id).subscribe({
      next: () => { this.loadCompetitions(); this.showToast('Competencia activada', 'success'); },
      error: () => this.showToast('Error al activar', 'error')
    });
  }
 
  finishCompetition(c: any) {
    if (!confirm(`¿Finalizar la competencia "${c.name}"?`)) return;
    this.adminService.finishCompetition(c.id).subscribe({
      next: () => { this.loadCompetitions(); this.showToast('Competencia finalizada', 'success'); },
      error: () => this.showToast('Error al finalizar', 'error')
    });
  }
 
  viewCompetition(c: any) {
    this.selectedCompetitionId  = c.id;
    this.showCompetitionDetailModal = true;
  }
 
  onCompetitionDetailClosed() {
    this.showCompetitionDetailModal = false;
    this.selectedCompetitionId = undefined;
  }
 
  closeCompetitionModal() { this.showCompetitionModal = false; }
 
  getCompetitionTypeClass(type: string): string {
    const classes: Record<string, string> = {
      RANKING: 'badge-ranking', CHALLENGE: 'badge-challenge', VERSUS: 'badge-versus'
    };
    return classes[type] ?? '';
  }
 
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador', ACTIVE: 'Activa', FINISHED: 'Finalizada'
    };
    return labels[status] ?? status;
  }
 
  // ─── TOAST ────────────────────────────────────────────────
 
  showToast(message: string, type: 'success' | 'error') {
    this.toast = { show: true, message, type };
    setTimeout(() => { this.toast.show = false; }, 3000);
  }

  recalculateCompetition(c: any) {
  this.adminService.recalculateCompetition(c.id).subscribe({
    next: () => this.showToast('Scores recalculados', 'success'),
    error: () => this.showToast('Error al recalcular', 'error')
  });
}

loadExercises() {
  this.loadingExercises = true;
  this.adminService.getExercises().subscribe({
    next: (data: any) => {
      // Maneja tanto array directo como objeto con content/data
      this.exercises         = Array.isArray(data) ? data : (data.content ?? data.data ?? []);
      this.filteredExercises = [...this.exercises];
      this.loadingExercises  = false;
      this.filterExercises();
    },
    error: () => {
      this.loadingExercises = false;
      this.showToast('Error cargando ejercicios', 'error');
    }
  });
}
 
  filterExercises() {
    const search = this.exerciseSearch.toLowerCase().trim();
    const muscle = this.exerciseMuscleFilter;
    const status = this.exerciseStatusFilter;
 
    this.filteredExercises = this.exercises.filter(ex => {
      const matchSearch = !search ||
        ex.name.toLowerCase().includes(search) ||
        ex.description?.toLowerCase().includes(search) ||
        ex.primaryMuscle?.toLowerCase().includes(search);
 
      const matchMuscle = !muscle || ex.primaryMuscle === muscle;
 
      const matchStatus = !status ||
        (status === 'active'   &&  ex.active) ||
        (status === 'inactive' && !ex.active);
 
      return matchSearch && matchMuscle && matchStatus;
    });
  }
 
  openCreateExercise() {
    this.editingExercise  = undefined;
    this.showExerciseModal = true;
  }
 
  editExercise(ex: Exercise) {
    this.editingExercise  = { ...ex };
    this.showExerciseModal = true;
  }
 
  onExerciseSaved() {
    this.showExerciseModal = false;
    this.editingExercise   = undefined;
    this.loadExercises();
    this.showToast(
      this.editingExercise ? 'Ejercicio actualizado' : 'Ejercicio creado',
      'success'
    );
  }
 
  onExerciseCancelled() {
    this.showExerciseModal = false;
    this.editingExercise   = undefined;
  }
 
  toggleExercise(ex: Exercise) {
    const accion = ex.active ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} "${ex.name}"?`)) return;
 
    const req = ex.active
      ? this.adminService.deactivateExercise(ex.id!)
      : this.adminService.activateExercise(ex.id!);
 
    req.subscribe({
      next: () => {
        this.loadExercises();
        this.showToast(`Ejercicio ${ex.active ? 'desactivado' : 'activado'}`, 'success');
      },
      error: () => this.showToast('Error al cambiar estado', 'error')
    });
  }


}
 