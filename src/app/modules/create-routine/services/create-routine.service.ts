import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRoutineRequest, CreateRoutineResponse, Exercise } from '../models/create-routine.models';

@Injectable({
  providedIn: 'root'
})
export class CreateRoutineService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva rutina
   */
  createRoutine(request: CreateRoutineRequest): Observable<CreateRoutineResponse> {
    return this.http.post<CreateRoutineResponse>(`${this.baseUrl}/routines`, request);
  }

  /**
   * Buscar ejercicios del catálogo
   */
  searchExercises(query: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.baseUrl}/exercises`, {
      params: { search: query, size: '20' }
    });
  }

  uploadRoutineImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<{ url: string; publicId: string }>(
    `${this.baseUrl}/routines/upload-image`,
    formData
  );
}


  /**
   * Obtener todos los ejercicios paginados
   */
  getExercises(page: number = 0, size: number = 50): Observable<{ content: Exercise[] }> {
    return this.http.get<{ content: Exercise[] }>(`${this.baseUrl}/exercises`, {
      params: { page: String(page), size: String(size) }
    });
  }
}

