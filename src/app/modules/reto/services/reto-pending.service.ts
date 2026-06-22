import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ParticipanteStatus, RetoResumen } from '../models/reto.models';
import { RetoService } from '../services/reto.service';

/** Gestiona banners/modales bloqueantes de post-test IPAQ y SUS. */
@Injectable({ providedIn: 'root' })
export class RetoPendingService {
  private _reto = new BehaviorSubject<RetoResumen | null>(null);
  private _estado = new BehaviorSubject<ParticipanteStatus | null>(null);

  reto$ = this._reto.asObservable();
  estado$ = this._estado.asObservable();

  constructor(private retoService: RetoService) {}

  refresh(): void {
    this.retoService.getRetosActivos().subscribe({
      next: (retos) => {
        const reto = retos[0] ?? null;
        this._reto.next(reto);
        if (reto) {
          this.retoService.getMiEstado(reto.id).subscribe({
            next: (st) => this._estado.next(st),
          });
        }
      },
    });
  }

  needsPosttestIpaq(st: ParticipanteStatus | null): boolean {
    return !!st?.posttestIpaqActivo && !st.completoPosttest && st.completoPretest;
  }

  needsSus(st: ParticipanteStatus | null): boolean {
    return !!st?.susActivo && !st.completoSus && st.completoPretest;
  }

  needsInscripcion(st: ParticipanteStatus | null): boolean {
    return !!st && !st.completoPretest;
  }
}
