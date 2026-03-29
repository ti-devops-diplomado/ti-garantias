import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasAnyRole(roles)) {
    return true;
  }

  if (auth.hasAnyRole(['Gestor', 'Admin'])) {
    return router.createUrlTree(['/pendientes-gestion']);
  }

  return router.createUrlTree(['/mis-registros']);
};
