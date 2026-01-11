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
  path: 'mis-rutinas',
  loadComponent: () =>
    import('./modules/my-routine/my-routine.component').then(m => m.MyRoutineComponent),
  canActivate: [authGuard]
},
{
  path: 'crear',
  loadComponent: () =>
    import('./modules/create-routine/create-routine.component').then(m => m.CreateRoutineComponent),
  canActivate: [authGuard]
},

{
  path: 'sesion-personalizada',
  loadComponent: () =>
    import('./modules/custom-session/custom-session.component').then(m => m.CustomSessionComponent),
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

{
  path: 'workouts/:sessionId/summary',
  loadComponent: () =>
    import('./modules/workout/summary/workout-summary.component').then(m => m.WorkoutSummaryComponent),
  canActivate: [authGuard]
},

{
  path: 'perfil',
  loadComponent: () =>
    import('./modules/profile/profile.component').then(m => m.ProfileComponent),
  canActivate: [authGuard]
},

{
  path: 'user/settings',
  loadComponent: () =>
    import('./modules/user/user.component').then(m => m.SettingsComponent),
  canActivate: [authGuard]
},

{
  path: 'perfil/historial',
  loadComponent: () =>
    import('./modules/profile/workout-history/workout-history.component')
      .then(m => m.WorkoutHistoryComponent),
},

{
  path: 'perfil/mis-rutinas',
  loadComponent: () =>
    import('./modules/profile/my-created-routines/my-created-routines.component')
      .then(m => m.MyCreatedRoutinesComponent),
  canActivate: [authGuard]
},

{
  path: 'perfil/hazanas',
  loadComponent: () =>
    import('./modules/profile/achievements/achievements.component')
      .then(m => m.AchievementsComponent),
  canActivate: [authGuard]
},

{
  path: 'perfil/estadisticas',
  loadComponent: () =>
    import('./modules/profile/stats/stats.component')
      .then(m => m.StatsComponent),
  canActivate: [authGuard]
},

{
  path: 'notificaciones',
  loadComponent: () =>
    import('./modules/notifications/notifications.component')
      .then(m => m.NotificationsComponent),
  canActivate: [authGuard]
},

{
  path: 'workouts/:sessionId',
  loadComponent: () =>
    import('./modules/workout/workout-detail/workout-detail.component')
      .then(m => m.WorkoutDetailComponent),
},


  { path: '**', redirectTo: '' }
];
