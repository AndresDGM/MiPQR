import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP para inyectar cabeceras de autenticación en las peticiones salientes.
 *
 * @description
 * Si existe un token almacenado en sesión o localStorage, se adjunta en el encabezado
 * `Authorization: Bearer <token>`.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
