import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../home/services/admin.service';
import { OrgTreeComponent, GroupTreeNode } from './org-three.component';
 
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OrgTreeComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
 
  activeSection: 'grupos' | 'invitaciones' | 'competencias' = 'grupos';
 
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
  savingInvitation = false;
 
  invitationForm = {
    groupId: null as number | null,
    code: '',
    maxUses: null as number | null,
    expiresAt: ''
  };
 
  // ─── COMPETENCIAS ─────────────────────────────────────────
  competitions: any[] = [];
  loadingCompetitions = false;
  competitionStatusFilter = '';
  competitionTypeFilter = '';
  showCompetitionModal = false;
  savingCompetition = false;
  scopeGroups: any[] = [];
  versusGroups: any[] = [];
 
  competitionForm = {
    name: '',
    competitionType: '',
    scopeLevel: '',
    scopeReferenceId: null as number | null,
    metricType: '',
    startDate: '',
    endDate: '',
    participantGroupIds: [] as number[]
  };
 
  // ─── TOAST ────────────────────────────────────────────────
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };
 
  constructor(private adminService: AdminService) {}
 
  ngOnInit(): void {
    this.loadGroups();
  }
 
  setSection(section: 'grupos' | 'invitaciones' | 'competencias') {
    this.activeSection = section;
    if (section === 'grupos')       this.loadGroups();
    if (section === 'invitaciones') this.loadInvitations();
    if (section === 'competencias') this.loadCompetitions();
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
    this.editingGroup = null;
    this.groupForm = { name: '', groupType: '', parentId: null, code: '', organizationKind: '' };
    this.loadAvailableParents();
    this.showGroupModal = true;
  }
 
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
 
  onTreeEdit(node: GroupTreeNode)       { this.editGroup(node); }
  onTreeDeactivate(node: GroupTreeNode) { this.deactivateGroup(node); }
 
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
    this.invitationForm = { groupId: null, code: '', maxUses: null, expiresAt: '' };
    this.loadLeafGroups();
    this.showInvitationModal = true;
  }
 
  loadLeafGroups() {
    this.adminService.getGroups({ type: 'GRUPO', active: 'true' }).subscribe({
      next: (data) => { this.leafGroups = data; },
      error: (err) => {
        console.error('Error cargando grupos:', err);
        this.showToast('Error cargando grupos disponibles', 'error');
      }
    });
  }
 
  saveInvitation() {
    if (!this.invitationForm.groupId) {
      this.showToast('Selecciona un grupo destino', 'error');
      return;
    }
    this.savingInvitation = true;
    const payload = {
      organizationalGroupId: this.invitationForm.groupId,
      code: this.invitationForm.code || undefined,
      maxUses: this.invitationForm.maxUses || undefined,
      expiresAt: this.invitationForm.expiresAt || undefined
    };
    this.adminService.createInvitation(payload).subscribe({
      next: () => {
        this.savingInvitation = false;
        this.closeInvitationModal();
        this.loadInvitations();
        this.showToast('Código generado', 'success');
      },
      error: (err) => {
        this.savingInvitation = false;
        this.showToast(err?.error?.message || 'Error al crear invitación', 'error');
      }
    });
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
 
  closeInvitationModal() { this.showInvitationModal = false; }
 
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
    this.competitionForm = {
      name: '', competitionType: '', scopeLevel: '', scopeReferenceId: null,
      metricType: '', startDate: '', endDate: '', participantGroupIds: []
    };
    this.scopeGroups = [];
    this.versusGroups = [];
    this.showCompetitionModal = true;
  }
 
  loadScopeGroups() {
    if (!this.competitionForm.scopeLevel) return;
    this.adminService.getGroups({ type: this.competitionForm.scopeLevel, active: 'true' }).subscribe({
      next: (data) => {
        this.scopeGroups = data;
        this.versusGroups = this.groups.filter((g: any) => g.groupType === 'GRUPO');
      }
    });
  }
 
  toggleVersusGroup(id: number) {
    const idx = this.competitionForm.participantGroupIds.indexOf(id);
    if (idx >= 0) {
      this.competitionForm.participantGroupIds.splice(idx, 1);
    } else {
      if (this.competitionForm.participantGroupIds.length < 2) {
        this.competitionForm.participantGroupIds.push(id);
      }
    }
  }
 
  saveCompetition() {
    const f = this.competitionForm;
    if (!f.name || !f.competitionType || !f.scopeLevel || !f.scopeReferenceId || !f.metricType || !f.startDate) {
      this.showToast('Completa todos los campos requeridos', 'error');
      return;
    }
    if (f.competitionType === 'VERSUS' && f.participantGroupIds.length !== 2) {
      this.showToast('VERSUS requiere exactamente 2 grupos', 'error');
      return;
    }
    this.savingCompetition = true;
    const payload = {
      ...f,
      endDate: f.endDate || undefined,
      participantGroupIds: f.participantGroupIds.length > 0 ? f.participantGroupIds : undefined
    };
    this.adminService.createCompetition(payload).subscribe({
      next: () => {
        this.savingCompetition = false;
        this.closeCompetitionModal();
        this.loadCompetitions();
        this.showToast('Competencia creada', 'success');
      },
      error: (err) => {
        this.savingCompetition = false;
        this.showToast(err?.error?.message || 'Error al crear competencia', 'error');
      }
    });
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
 
  viewCompetition(c: any) {}
 
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
}