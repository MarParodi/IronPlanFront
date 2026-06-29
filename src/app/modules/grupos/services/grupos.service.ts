import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HierarchyPath {
  ancestorIds: number[];
  rootName: string;
  middlePath?: string | null;
  leafName?: string | null;
  displayPath: string;
}

export interface MembershipSummary {
  groupId: number;
  groupName: string;
  groupCode: string;
  groupType: string;
  role: string;
  canManage: boolean;
  memberCount: number;
  activeCompetitionsCount: number;
  hierarchyPath: HierarchyPath;
}

export interface GroupDetail {
  groupId: number;
  groupName: string;
  groupCode: string;
  groupType: string;
  active: boolean;
  role: string;
  canManage: boolean;
  memberCount: number;
  activeCompetitionsCount: number;
  hierarchyPath: HierarchyPath;
}

export interface GroupMember {
  userId: number;
  fullName: string;
  username: string;
  role: string;
  level?: string;
  joinedAt: string;
  profilePictureUrl?: string;
}

export interface ObjectiveDistributionPoint {
  objective: string;
  label: string;
  count: number;
}

export interface GroupMetrics {
  periodDays: number;
  periodStart: string;
  periodEnd: string;
  totalMembers: number;
  activeMembers: number;
  adherencePercent: number;
  participationPercent: number;
  totalWorkouts: number;
  totalSessions: number;
  totalActiveMinutes: number;
  avgWorkoutsPerActiveMember: number;
  weeklyWorkouts: WeeklyMetricPoint[];
  topParticipants: ParticipantMetricRank[];
  objectiveDistribution?: ObjectiveDistributionPoint[];
}

export interface WeeklyMetricPoint {
  weekStart: string;
  weekLabel: string;
  workouts: number;
  activeMembers: number;
}

export interface ParticipantMetricRank {
  rank: number;
  userId: number;
  fullName: string;
  username: string;
  profilePictureUrl?: string;
  workouts: number;
  activeMinutes: number;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class GruposService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/grupos`;

  getMisGrupos(): Observable<MembershipSummary[]> {
    return this.http.get<MembershipSummary[]>(`${this.base}/mis-grupos`);
  }

  getAdministrar(): Observable<MembershipSummary[]> {
    return this.http.get<MembershipSummary[]>(`${this.base}/administrar`);
  }

  getResumen(groupId: number): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.base}/${groupId}/resumen`);
  }

  getMiembros(groupId: number): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.base}/${groupId}/miembros`);
  }

  addMiembro(groupId: number, body: { identifier: string; membershipRole: 'MEMBER' | 'ADMIN' }): Observable<GroupMember> {
    return this.http.post<GroupMember>(`${this.base}/${groupId}/miembros`, body);
  }

  updateMiembroRol(groupId: number, userId: number, role: 'MEMBER' | 'ADMIN'): Observable<GroupMember> {
    return this.http.patch<GroupMember>(`${this.base}/${groupId}/miembros/${userId}`, { role });
  }

  removeMiembro(groupId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${groupId}/miembros/${userId}`);
  }

  getMetricas(groupId: number, days = 30): Observable<GroupMetrics> {
    return this.http.get<GroupMetrics>(`${this.base}/${groupId}/metricas`, { params: { days } });
  }

  getRetos(groupId: number): Observable<RetoSummary[]> {
    return this.http.get<RetoSummary[]>(`${this.base}/${groupId}/retos`);
  }

  getRetoDetail(groupId: number, competitionId: number): Observable<CompetitionDetailView> {
    return this.http.get<CompetitionDetailView>(`${this.base}/${groupId}/retos/${competitionId}`);
  }

  createReto(groupId: number, body: CreateRetoRequest): Observable<RetoSummary & { id: number; status: string }> {
    return this.http.post<RetoSummary & { id: number; status: string }>(`${this.base}/${groupId}/retos`, body);
  }

  activateReto(groupId: number, competitionId: number): Observable<{ id: number; status: string }> {
    return this.http.post<{ id: number; status: string }>(`${this.base}/${groupId}/retos/${competitionId}/activate`, {});
  }

  getRetoPodiums(competitionId: number): Observable<PodiumsResponse> {
    return this.http.get<PodiumsResponse>(`${environment.apiUrl}/competitions/${competitionId}/podiums`);
  }

  getRetoWinners(competitionId: number): Observable<DeclaredWinnerDto[]> {
    return this.http.get<DeclaredWinnerDto[]>(`${environment.apiUrl}/competitions/${competitionId}/winners`);
  }
}

export interface CreateRetoRequest {
  name: string;
  competitionType: 'RANKING' | 'CHALLENGE' | 'VERSUS';
  metricType: 'SESSIONS' | 'ACTIVE_MINUTES' | 'WORKOUTS_COUNT';
  startDate: string;
  endDate?: string;
  participantUserIds?: number[];
}

export interface WinnerInfo {
  id?: number;
  name?: string;
  score?: number;
  tie?: boolean;
  type?: string;
}

export interface RetoSummary {
  id: number;
  name: string;
  competitionType: string;
  scopeLevel: string;
  metricType: string;
  startDate: string;
  endDate?: string;
  status: string;
  participantCount: number;
  isMemberCompetition: boolean;
  leader?: WinnerInfo;
  metricLabel?: string;
}

export interface CompetitionDetailView {
  competition: RetoSummary & { scopeReferenceName?: string; createdAt?: string };
  groupLeaderboard?: GroupLeaderboardEntry[];
  memberLeaderboard?: MemberLeaderboardEntry[];
  internalRanking?: InternalRankingEntry[];
  winner?: WinnerInfo;
  myScore?: MyCompetitionScore;
  metricLabel?: string;
  lastCalculatedAt?: string;
}

export interface GroupLeaderboardEntry {
  rank: number;
  groupId: number;
  groupName: string;
  groupScore: number;
  activeMembers: number;
}

export interface MemberLeaderboardEntry {
  rank: number;
  userId: number;
  fullName: string;
  username: string;
  profilePictureUrl?: string;
  score: number;
}

export interface InternalRankingEntry {
  position: number;
  userId: number;
  fullName: string;
  username: string;
  profilePictureUrl?: string;
  score: number;
}

export interface MyCompetitionScore {
  groupRank?: number;
  groupScore?: number;
  internalRank?: number;
  individualScore?: number;
  groupName?: string;
  memberRank?: number;
  isMemberCompetition?: boolean;
  participantGroupId?: number;
}

export interface PodiumEntryDto {
  rank: number;
  userId: number;
  fullName: string;
  username?: string;
  profilePictureUrl?: string;
  levelCategory?: string;
  compositeScore: number;
  consistencyRaw: number;
  oneRmProgressRaw: number;
  volumeRaw: number;
  consistencyNorm?: number;
  oneRmNorm?: number;
  volumeNorm?: number;
}

export interface PodiumsResponse {
  generated?: string;
  generalTop3: PodiumEntryDto[];
  byLevel: Record<string, PodiumEntryDto[]>;
}

export interface DeclaredWinnerDto {
  scope: string;
  levelCategory?: string;
  levelLabel: string;
  userId: number;
  fullName: string;
  username?: string;
  profilePictureUrl?: string;
  declaredAt?: string;
}
