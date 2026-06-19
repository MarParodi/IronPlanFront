import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateFreeActivityRequest,
  FreeActivityResponse,
} from '../models/free-activity.models';

@Injectable({ providedIn: 'root' })
export class FreeActivityService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/free-activities`;

  create(body: CreateFreeActivityRequest): Observable<FreeActivityResponse> {
    return this.http.post<FreeActivityResponse>(this.baseUrl, body);
  }

  getMine(): Observable<FreeActivityResponse[]> {
    return this.http.get<FreeActivityResponse[]>(`${this.baseUrl}/mine`);
  }
}
