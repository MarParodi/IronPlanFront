import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { TrainingSessionDetail } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class AcademyService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl; // 'http://localhost:8080/api'

  getSession(routineId: number, sessionId: number): Observable<TrainingSessionDetail> {
    return this.http.get<TrainingSessionDetail>(
      `${this.baseUrl}/routines/${routineId}/sessions/${sessionId}`
    );
  }

  skipSession(routineDetailId: number) {
  return this.http.post<{ sessionId: number; message: string }>(
    `${this.baseUrl}/workouts/skip`,
    { routineDetailId }
  );
}


  // ...lo que ya tengas
}
