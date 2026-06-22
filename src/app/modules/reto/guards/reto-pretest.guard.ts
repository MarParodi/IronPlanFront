import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RetoService } from '../services/reto.service';
import { map, catchError, of } from 'rxjs';

/** Redirige a inscripción si el usuario no completó el IPAQ pre-test del reto activo vinculado. */
export const retoPretestGuard: CanActivateFn = (route) => {
  const retoService = inject(RetoService);
  const router = inject(Router);
  const retoId = route.paramMap.get('retoId') ?? route.queryParamMap.get('retoId');

  if (!retoId) return true;

  return retoService.getMiEstado(Number(retoId)).pipe(
    map((st) => {
      if (!st.completoPretest) {
        return router.createUrlTree(['/reto', retoId, 'inscripcion']);
      }
      return true;
    }),
    catchError(() => of(true))
  );
};
