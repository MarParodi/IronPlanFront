import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/users'; 

  // Para actualizar username, birthday, gender
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  // Para subir la foto de perfil a Cloudinary vía Backend
  uploadPhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/profile/photo`, formData);
  }

  // Para obtener los datos del usuario logueado (Endpoint /me)
  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }
}