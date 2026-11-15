import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../application/auth/auth.service';

/**
 * Interceptor HTTP para captura y normalización de errores globales en respuestas HTTP.
 *
 * @description
 * Procesa respuestas de error comunes (400, 401, 403, 404, 500)
 * registrándolas o preparando la trazabilidad adecuada.
 *
 * Ante un 401 de cualquier petición distinta del login, cierra la sesión y envía al usuario a /login.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Token ausente, invalido o expirado: la sesion ya no es valida
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        router.navigateByUrl('/login');
      }

      let errorMessage = 'Ocurrió un error inesperado en la comunicación con el servidor.';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error del cliente: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Solicitud inválida.';
            break;
          case 401:
            errorMessage = 'Sesión no autorizada o expirada.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para ejecutar esta acción.';
            break;
          case 404:
            errorMessage = error.error?.message || 'Recurso no encontrado en el servidor.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente más tarde.';
            break;
          default:
            errorMessage = error.error?.message || `Error del servidor (${error.status})`;
        }
      }

      console.error(`[HTTP Error ${error.status}]:`, errorMessage, error);
      return throwError(() => error);
    })
  );
};
