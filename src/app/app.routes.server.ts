import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos - usar SSR en lugar de prerenderizado
  {
    path: 'routines/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'academia/routines/:routineId/sessions/:sessionId',
    renderMode: RenderMode.Server
  },
  {
    path: 'workouts/:sessionId/exercise/:order',
    renderMode: RenderMode.Server
  },
  // Resto de rutas - prerenderizar
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
