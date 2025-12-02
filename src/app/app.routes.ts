// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './modules/auth/pages/role.guard';

export const routes: Routes = [
  { path: '',   loadComponent: () =>
    import('./modules/home/home.component').then(m => m.HomeComponent),
  canActivate: [authGuard]
},
  { path: 'login', loadComponent: () => import('./modules/auth/pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./modules/auth/pages/register/register.component').then(m => m.RegisterComponent) },
  {
  path: 'academia',
  loadComponent: () =>
    import('./modules/home/home.component').then(m => m.HomeComponent),
  canActivate: [authGuard]
},

  { path: '**', redirectTo: '' }
];
