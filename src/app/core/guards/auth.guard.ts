// src/app/core/auth/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../modules/auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  if (isBrowser && auth.isLoggedIn) return true;
  if (!isBrowser) return true; // en SSR deja pasar y el cliente decide
  router.navigate(['/login']);
  return false;
};
