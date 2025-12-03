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

{
    path: 'routines/:id',
    loadComponent: () =>
      import('./modules/home/routine/routine.component')
        .then(m => m.RoutineOverviewComponent),
    canActivate: [authGuard],
  },

{
  path: 'academia/routines/:routineId/sessions/:sessionId',
  loadComponent: () =>
    import('./modules/session/session.component').then(m => m.SessionComponent)
},

{
  path: 'workouts/:sessionId/exercise/:order',
  loadComponent: () =>
    import('./modules/workout/workout_exercise.component').then(m => m.WorkoutExercisePageComponent),
  canActivate: [authGuard]
},


  { path: '**', redirectTo: '' }
];
