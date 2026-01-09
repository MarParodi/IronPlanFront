import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas - prerenderizar
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'register',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'academia',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'mis-rutinas',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'crear',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'perfil',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'perfil/hazanas',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'perfil/estadisticas',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'perfil/mis-rutinas',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'perfil/historial',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'user/settings',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'notificaciones',
    renderMode: RenderMode.Prerender
  },
  // Todas las demás rutas (incluyendo las dinámicas) - SSR
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
