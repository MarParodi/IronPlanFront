import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MeResponse, UserUpdatePayload } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  updateProfile(data: UserUpdatePayload): Observable<MeResponse> {
    return this.http.put<MeResponse>(`${this.baseUrl}/users/profile`, data);
  }

  uploadPhoto(file: File): Observable<{ profilePictureUrl?: string; profile_picture_url?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ profilePictureUrl?: string; profile_picture_url?: string }>(
      `${this.baseUrl}/users/profile/photo`,
      formData
    );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.baseUrl}/users/me`);
  }

  validateOrganizationCode(code: string): Observable<{
    code: string;
    groupId: number;
    groupName: string;
    organizationRootName: string;
  }> {
    return this.http.post<{
      code: string;
      groupId: number;
      groupName: string;
      organizationRootName: string;
    }>(`${this.baseUrl}/users/me/organization/validate-code`, { code });
  }

  joinOrganization(code: string): Observable<MeResponse> {
    return this.http.post<MeResponse>(`${this.baseUrl}/users/me/organization/join`, { code });
  }
}
