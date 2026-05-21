import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
 
@Injectable({ providedIn: 'root' })
export class AdminService {
 
  private base = environment.apiUrl;
 
  constructor(private http: HttpClient) {}
 
  // ─── GRUPOS ───────────────────────────────────────────────
 
  getGroups(filters: { type?: string; active?: string; parentId?: number } = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.type)     params = params.set('type', filters.type);
    if (filters.active)   params = params.set('active', filters.active);
    if (filters.parentId) params = params.set('parentId', filters.parentId);
    return this.http.get<any[]>(`${this.base}/admin/organizational-groups`, { params });
  }
 
  createGroup(body: any): Observable<any> {
    return this.http.post(`${this.base}/admin/organizational-groups`, body);
  }
 
  updateGroup(id: number, body: any): Observable<any> {
    return this.http.patch(`${this.base}/admin/organizational-groups/${id}`, body);
  }
 
  deactivateGroup(id: number): Observable<any> {
    return this.http.post(`${this.base}/admin/organizational-groups/${id}/deactivate`, {});
  }
 
  getGroupTree(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/organizational-groups/tree`);
  }
 
  // Cascade — crear/editar jerarquía completa de una org
  createOrganizationCascade(body: any): Observable<any> {
    return this.http.post(`${this.base}/admin/organizational-groups/cascade`, body);
  }
 
  updateOrganizationCascade(id: number, body: any): Observable<any> {
    return this.http.put(`${this.base}/admin/organizational-groups/cascade/${id}`, body);
  }
 
  getOrganizationCascade(id: number): Observable<any> {
    return this.http.get(`${this.base}/admin/organizational-groups/cascade/${id}`);
  }
 
  // ─── INVITACIONES ─────────────────────────────────────────
 
  getInvitations(filters: { groupId?: number; active?: boolean } = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.groupId !== undefined) params = params.set('groupId', filters.groupId);
    if (filters.active  !== undefined) params = params.set('active', filters.active);
    return this.http.get<any[]>(`${this.base}/admin/organizational-invitations`, { params });
  }
 
  createInvitation(body: any): Observable<any> {
    return this.http.post(
      `${this.base}/admin/organizational-groups/${body.organizationalGroupId}/invitations`, body);
  }
 
  deactivateInvitation(id: number): Observable<any> {
    return this.http.patch(`${this.base}/admin/organizational-invitations/${id}`, { active: false });
  }
 
  // ─── COMPETENCIAS ─────────────────────────────────────────
 
  getCompetitions(filters: { status?: string; type?: string } = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type)   params = params.set('type', filters.type);
    return this.http.get<any[]>(`${this.base}/admin/competitions`, { params });
  }
 
  createCompetition(body: any): Observable<any> {
    return this.http.post(`${this.base}/admin/competitions`, body);
  }
 
  activateCompetition(id: number): Observable<any> {
    return this.http.post(`${this.base}/admin/competitions/${id}/activate`, {});
  }
 
  finishCompetition(id: number): Observable<any> {
    return this.http.post(`${this.base}/admin/competitions/${id}/finish`, {});
  }
 
  // ─── SCOPE / SELECTOR DE PARTICIPANTES ───────────────────
 
  // Hijos directos de un nodo (para navegar la jerarquía en el selector)
  getScopeChildren(groupId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/competitions/scope/${groupId}/children`);
  }
 
  // Miembros de un grupo hoja (para competencia individual)
  getGroupMembers(groupId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/competitions/scope/${groupId}/members`);
  }

  recalculateCompetition(id: number): Observable<any> {
  return this.http.post(`${this.base}/admin/competitions/${id}/recalculate`, {});
}

getExercises() {
    return this.http.get<any[]>(`${this.base}/exercises`);
  }
 
  createExercise(payload: any) {
    return this.http.post(`${this.base}/exercises`, payload);
  }
 
  updateExercise(id: number, payload: any) {
    return this.http.put(`${this.base}/exercises/${id}`, payload);
  }
 
  deactivateExercise(id: number) {
    return this.http.patch(`${this.base}/exercises/${id}/deactivate`, {});
  }
 
  activateExercise(id: number) {
    return this.http.patch(`${this.base}/exercises/${id}/activate`, {});
  }

   getCompetitionById(id: number) {
    return this.http.get<any>(`${this.base}/admin/competitions/${id}`);
  }
 
  getLeaderboard(id: number) {
    return this.http.get<any[]>(`${this.base}/competitions/${id}/leaderboard`);
  }
 
  getMemberLeaderboard(id: number) {
    return this.http.get<any[]>(`${this.base}/competitions/${id}/leaderboard/members`);
  }

  getParticipantMembers(competitionId: number, groupId: number) {
    return this.http.get<any[]>(
        `${this.base}/admin/competitions/${competitionId}/participants/${groupId}/members`
    );
}

}