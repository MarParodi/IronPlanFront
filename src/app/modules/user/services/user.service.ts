import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
private readonly baseUrl = environment.apiUrl;

  // Para actualizar username, birthday, gender
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/profile`, data);
  }

  // Para subir la foto de perfil a Cloudinary vía Backend
  uploadPhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/users/profile/photo`, formData);
  }

  // Para obtener los datos del usuario logueado (Endpoint /me)
  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/me`);
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

  joinOrganization(code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/me/organization/join`, { code });
  }
}