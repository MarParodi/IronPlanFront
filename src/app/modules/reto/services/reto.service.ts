import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExperimentoEstado,
  InscripcionRequest,
  IpaqSubmitRequest,
  IpaqSubmitResponse,
  ParticipanteStatus,
  RetoResumen,
  CreateRetoRequest,
  CompetitionCandidate,
  SusResumen,
  SusSubmitRequest,
} from '../models/reto.models';

@Injectable({ providedIn: 'root' })
export class RetoService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRetosActivos(): Observable<RetoResumen[]> {
    return this.http.get<RetoResumen[]>(`${this.base}/retos/activos`);
  }

  getMiEstado(retoId: number): Observable<ParticipanteStatus> {
    return this.http.get<ParticipanteStatus>(`${this.base}/retos/${retoId}/mi-estado`);
  }

  inscribir(retoId: number, body: InscripcionRequest): Observable<{ participanteRetoId: number }> {
    return this.http.post<{ participanteRetoId: number }>(`${this.base}/retos/${retoId}/inscripcion`, body);
  }

  consentimiento(retoId: number, participanteRetoId: number, acepto = true): Observable<void> {
    return this.http.post<void>(`${this.base}/retos/${retoId}/consentimiento`, {
      participanteRetoId,
      acepto,
    });
  }

  submitIpaq(retoId: number, body: IpaqSubmitRequest): Observable<IpaqSubmitResponse> {
    return this.http.post<IpaqSubmitResponse>(`${this.base}/retos/${retoId}/ipaq`, body);
  }

  getIpaq(retoId: number, participanteRetoId: number): Observable<{ pre: unknown; post: unknown }> {
    return this.http.get<{ pre: unknown; post: unknown }>(
      `${this.base}/retos/${retoId}/ipaq/${participanteRetoId}`
    );
  }

  submitSus(retoId: number, body: SusSubmitRequest): Observable<{ puntajeSus: number; clasificacion: string }> {
    return this.http.post<{ puntajeSus: number; clasificacion: string }>(`${this.base}/retos/${retoId}/sus`, body);
  }

  // Admin
  listRetosAdmin(): Observable<RetoResumen[]> {
    return this.http.get<RetoResumen[]>(`${this.base}/admin/retos`);
  }

  createRetoAdmin(body: CreateRetoRequest): Observable<RetoResumen> {
    return this.http.post<RetoResumen>(`${this.base}/admin/retos`, body);
  }

  vincularCompetition(retoId: number, competitionId: number | null): Observable<RetoResumen> {
    return this.http.patch<RetoResumen>(`${this.base}/admin/retos/${retoId}/competition`, {
      competitionId,
    });
  }

  listCompetenciasCandidatas(retoId: number): Observable<CompetitionCandidate[]> {
    return this.http.get<CompetitionCandidate[]>(`${this.base}/admin/retos/${retoId}/competencias-candidatas`);
  }

  listCompetenciasCandidatasPorOrg(organizacionId: number): Observable<CompetitionCandidate[]> {
    return this.http.get<CompetitionCandidate[]>(`${this.base}/admin/retos/competencias-candidatas`, {
      params: { organizacionId: String(organizacionId) },
    });
  }

  deleteReto(retoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/retos/${retoId}`);
  }

  getExperimentoEstado(retoId: number): Observable<ExperimentoEstado> {
    return this.http.get<ExperimentoEstado>(`${this.base}/admin/retos/${retoId}/experimento`);
  }

  getSusResumen(retoId: number): Observable<SusResumen> {
    return this.http.get<SusResumen>(`${this.base}/admin/retos/${retoId}/sus/resumen`);
  }

  activarReto(retoId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/retos/${retoId}/activar`, {});
  }

  activarPosttest(retoId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/retos/${retoId}/activar-posttest`, {});
  }

  activarSus(retoId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/retos/${retoId}/activar-sus`, {});
  }

  cerrarReto(retoId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/retos/${retoId}/cerrar`, {});
  }

  generarSnapshots(retoId: number): Observable<{ semanaGenerada: number; usuariosProcesados: number }> {
    return this.http.post<{ semanaGenerada: number; usuariosProcesados: number }>(
      `${this.base}/admin/retos/${retoId}/snapshots/generar`,
      {}
    );
  }

  exportarCsv(retoId: number, opts: { incluirOutliers?: boolean; soloCompletos?: boolean } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (opts.incluirOutliers) params = params.set('incluirOutliers', 'true');
    if (opts.soloCompletos === false) params = params.set('soloCompletos', 'false');
    return this.http.get(`${this.base}/admin/retos/${retoId}/exportar/csv`, {
      params,
      responseType: 'blob',
    });
  }
}
