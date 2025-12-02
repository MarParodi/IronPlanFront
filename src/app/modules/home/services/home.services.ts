// services/home.services.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardsPage, Card } from '../models/response/card_response';
import { RoutineDetailResponse } from '../models/response/detail_routine_response';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCardsPage(params: { page?: number; size?: number; sort?: string; goal?: string; }): Observable<CardsPage> {
    const { page = 0, size = 12, sort = 'name,asc', goal } = params ?? {};
    const url = `${this.baseUrl}/routines`;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (goal) query.set('goal', goal);

    return this.http.get<any>(`${url}?${query.toString()}`).pipe(
      map(p => ({
        ...p,
        content: (p.content ?? []).map((r: any): Card => ({
          id: String(r.id),
          name: r.name,
          img: r.img,                 // ← mapeo
          accessType: r.accessType,
          goal: r.goal,
          description: r.description
          
        }))
      }))
    );
  }


  getRoutineDetail(id: string): Observable<RoutineDetailResponse> {
  const url = `${this.baseUrl}/routines/${id}`;
  return this.http.get<RoutineDetailResponse>(url);
}






}
