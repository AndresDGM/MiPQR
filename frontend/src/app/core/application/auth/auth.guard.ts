import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleName } from '../../domain/models/user.model';
import { AuthService } from './auth.service';

/**
 * Guard funcional para proteger rutas según roles permitidos.
 *
 * @param rolesPermitidos Lista opcional de roles que tienen acceso a la ruta
 * @returns Función CanActivateFn para Angular Router
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export function authGuard(rolesPermitidos?: UserRoleName[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (rolesPermitidos && rolesPermitidos.length > 0) {
      const userRol = authService.userRol();
      if (!userRol || !rolesPermitidos.includes(userRol)) {
        return router.createUrlTree(['/']);
      }
    }

    return true;
  };
}
