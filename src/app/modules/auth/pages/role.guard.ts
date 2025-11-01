// src/app/core/auth/role.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard = (role: 'ADMIN' | 'USER'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn && auth.role === role) return true;
    router.navigate(['/']);
    return false;
  };
};